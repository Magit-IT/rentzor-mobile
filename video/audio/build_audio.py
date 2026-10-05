"""
Procedural, royalty-free soundtrack + UI sound effects for the Rentzor Reels.

Everything is synthesised from oscillators and seeded noise, so the output is
deterministic and there is nothing to license. Run from video/:

    python3 audio/build_audio.py

Writes public/audio/*.wav. Requires numpy + scipy.

Music is 120 BPM (one beat = 15 frames at 30 fps, one bar = 60 frames), so
the compositions cut on bar lines and the edits land on the downbeat.
"""

from __future__ import annotations

import os
import wave

import numpy as np
from scipy import signal

SR = 44100
BPM = 120
BEAT = 60.0 / BPM
BAR = BEAT * 4
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')

rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers

def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def note_hz(name: str) -> float:
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7,
             'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + names[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(phase: np.ndarray) -> np.ndarray:
    return 2.0 * (phase - np.floor(phase + 0.5))


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = signal.butter(order, min(cutoff, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = signal.butter(order, cutoff / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_filter(x: np.ndarray, f0: float, f1: float, q: float = 0.7,
                 block: int = 256) -> np.ndarray:
    """Time-varying low-pass (exponential sweep f0 -> f1), block-wise biquad."""
    out = np.zeros_like(x)
    zi = np.zeros(2)
    n_blocks = int(np.ceil(len(x) / block))
    for i in range(n_blocks):
        frac = i / max(1, n_blocks - 1)
        fc = f0 * (f1 / f0) ** frac
        w0 = 2 * np.pi * min(fc, SR / 2.2) / SR
        alpha = np.sin(w0) / (2 * q)
        cos = np.cos(w0)
        b = np.array([(1 - cos) / 2, 1 - cos, (1 - cos) / 2])
        a = np.array([1 + alpha, -2 * cos, 1 - alpha])
        seg = x[i * block:(i + 1) * block]
        y, zi = signal.lfilter(b / a[0], a / a[0], seg, zi=zi)
        out[i * block:(i + 1) * block] = y
    return out


def env_ad(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))
    return a * d


def reverb_ir(seconds: float, decay: float, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    t = t_axis(seconds)
    ir = r.standard_normal((len(t), 2)) * np.exp(-t / decay)[:, None]
    ir[:, 0] = lowpass(ir[:, 0], 6000)
    ir[:, 1] = lowpass(ir[:, 1], 6000)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def reverb(x: np.ndarray, wet: float, seconds: float = 2.2, decay: float = 0.55,
           seed: int = 1) -> np.ndarray:
    ir = reverb_ir(seconds, decay, seed)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    out = np.zeros((len(x) + len(ir) - 1, 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], ir[:, c])
    dry = np.zeros_like(out)
    dry[: len(x)] = x
    return dry * (1 - wet * 0.5) + out * wet


def pan(x: np.ndarray, p: float) -> np.ndarray:
    """p in [-1, 1] -> constant-power stereo."""
    ang = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1)


def place(buf: np.ndarray, clip: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(round(at * SR))
    if i >= len(buf):
        return
    if clip.ndim == 1:
        clip = np.stack([clip, clip], axis=1)
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * gain


def write_wav(name: str, x: np.ndarray, peak_db: float = -1.0) -> None:
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * (10 ** (peak_db / 20))
    # 5 ms fades so nothing clicks at the edges
    f = int(0.005 * SR)
    ramp = np.linspace(0, 1, f)[:, None]
    x[:f] *= ramp
    x[-f:] *= ramp[::-1]
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    path = os.path.join(OUT, name)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'wrote {path} ({len(x) / SR:.2f}s)')


# ---------------------------------------------------------------- drum kit

def kick() -> np.ndarray:
    t = t_axis(0.45)
    f = 56 + 120 * np.exp(-t / 0.03)
    phase = np.cumsum(f) / SR
    body = np.sin(2 * np.pi * phase) * np.exp(-t / 0.11)
    knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.025) * 0.35
    click = highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.5
    k = np.tanh((body + knock + click) * 1.6)
    return k


def clap() -> np.ndarray:
    t = t_axis(0.35)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for off in (0.0, 0.009, 0.018):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) / 0.007)
    e += np.exp(-t / 0.09) * 0.55 * (t > 0.027)
    c = bandpass(n, 900, 4200) * e
    return c


def hat(open_: bool = False) -> np.ndarray:
    t = t_axis(0.3 if open_ else 0.06)
    n = rng.standard_normal(len(t))
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3200, 4570, 6230, 8150)) * 0.15
    h = highpass(n + metal, 7000) * np.exp(-t / (0.09 if open_ else 0.014))
    return h


def crash() -> np.ndarray:
    t = t_axis(2.2)
    n = rng.standard_normal(len(t))
    c = highpass(n, 4500) * np.exp(-t / 0.55)
    return c


# ---------------------------------------------------------------- synths

PROGRESSION = [  # one chord per bar: C(add9) - G - Am7 - Fmaj7  (I-V-vi-IV)
    {'root': 'C2', 'pad': ['C4', 'E4', 'G4', 'D5'], 'arp': ['C5', 'G5', 'E5', 'D6']},
    {'root': 'G1', 'pad': ['B3', 'D4', 'G4', 'A4'], 'arp': ['B4', 'G5', 'D5', 'A5']},
    {'root': 'A1', 'pad': ['C4', 'E4', 'G4', 'A4'], 'arp': ['A4', 'E5', 'C5', 'G5']},
    {'root': 'F1', 'pad': ['A3', 'C4', 'E4', 'G4'], 'arp': ['A4', 'F5', 'C5', 'E5']},
]


def pad_chord(notes: list[str], seconds: float, cutoff: float) -> np.ndarray:
    t = t_axis(seconds)
    out = np.zeros((len(t), 2))
    for j, nm in enumerate(notes):
        f = note_hz(nm)
        for d, p in ((-0.11, -0.6), (0.0, 0.0), (0.12, 0.6)):
            fd = f * 2 ** (d / 12)
            ph = rng.random()
            v = saw(fd * t + ph) * 0.18
            out += pan(v, p * 0.7)
    a = np.clip(t / 0.08, 0, 1) * np.clip((seconds - t) / 0.12, 0, 1)
    out *= a[:, None]
    out[:, 0] = lowpass(out[:, 0], cutoff)
    out[:, 1] = lowpass(out[:, 1], cutoff)
    return out


def pluck(nm: str, seconds: float = 0.35, bright: float = 4200) -> np.ndarray:
    t = t_axis(seconds)
    f = note_hz(nm)
    v = (saw(f * t) * 0.6 + np.sign(np.sin(2 * np.pi * f * t)) * 0.25 + np.sin(2 * np.pi * f * t) * 0.4)
    v = sweep_filter(v * env_ad(len(t), 0.002, 0.11), bright, 600, q=0.9, block=128)
    return v


def bass_note(nm: str, seconds: float) -> np.ndarray:
    t = t_axis(seconds)
    f = note_hz(nm) * 2  # one octave up so phone speakers can carry it
    v = saw(f * t) * 0.5 + np.sin(2 * np.pi * f * t) * 0.8 + np.sin(np.pi * f * t) * 0.5
    v = lowpass(v, 520, order=2) * env_ad(len(t), 0.004, 0.18)
    return np.tanh(v * 1.4)


def bell(nm: str, seconds: float = 1.2) -> np.ndarray:
    t = t_axis(seconds)
    f = note_hz(nm)
    v = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.5)
         + 0.45 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
         + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.12)
         + 0.12 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t / 0.07))
    return v * np.clip(t / 0.002, 0, 1)


def riser(seconds: float) -> np.ndarray:
    t = t_axis(seconds)
    n = rng.standard_normal(len(t))
    r = sweep_filter(n, 300, 9000, q=1.4) * (t / seconds) ** 2
    return r


# ---------------------------------------------------------------- arrangement

LAYERS = ('kick', 'clap', 'hats', 'bass', 'pad', 'arp', 'bell')

SECTIONS = {
    #          kick clap hats bass pad  arp  bell   pad cutoff
    'intro':  (0,   0,   1,   0,   1,   1,   0,     1400),
    'lift':   (1,   0,   1,   0,   1,   1,   0,     2200),
    'groove': (1,   1,   1,   1,   1,   1,   0,     2600),
    'drop':   (1,   1,   1,   1,   1,   1,   1,     3600),
    'break':  (0,   0,   0,   0,   1,   1,   1,     1800),
}


def render_track(bars: list[str], tail: float, risers_at: list[int], crash_at: list[int],
                 end_hit_bar: int, arp_gain: float = 0.8) -> np.ndarray:
    total = len(bars) * BAR + tail
    n = int(total * SR)
    drums = np.zeros((n, 2))
    music = np.zeros((n, 2))
    side = np.ones(n)  # sidechain gain for the tonal layers

    K, C, HC, HO = kick(), clap(), hat(False), hat(True)
    for b, sec in enumerate(bars):
        flags = SECTIONS[sec]
        on = dict(zip(LAYERS, flags[:7]))
        cutoff = flags[7]
        chord = PROGRESSION[b % 4]
        t0 = b * BAR
        for beat in range(4):
            tb = t0 + beat * BEAT
            if on['kick']:
                place(drums, K, tb, 0.62)
                i = int(tb * SR)
                m = min(n - i, int(0.3 * SR))
                tt = np.arange(m) / SR
                side[i:i + m] = np.minimum(side[i:i + m], 1 - 0.55 * np.exp(-tt / 0.11))
            if on['clap'] and beat in (1, 3):
                place(drums, pan(C, 0.05), tb, 0.85)
            if on['hats']:
                place(drums, pan(HC, 0.25), tb + BEAT / 2, 0.55)
                place(drums, pan(HC, -0.2), tb + BEAT / 4 * 3, 0.2)
                if sec in ('groove', 'drop') and beat == 3:
                    place(drums, pan(HO, 0.3), tb + BEAT / 2, 0.3)
        if on['bass']:
            for k in range(8):  # off-beat eighths, pumping house bass
                if k % 2 == 1:
                    place(music, pan(bass_note(chord['root'], BEAT / 2 * 0.95), 0), t0 + k * BEAT / 2, 0.55)
        if on['pad']:
            place(music, pad_chord(chord['pad'], BAR, cutoff), t0, 0.55)
        if on['arp']:
            seq = chord['arp']
            for k in range(16):
                if k % 4 == 3 and sec in ('intro', 'break'):
                    continue
                nm = seq[(k * 3) % 4]
                p = pluck(nm, 0.3, 2400 + cutoff)
                place(music, pan(p, 0.35 if k % 2 else -0.35), t0 + k * BEAT / 4, arp_gain * (1.0 if k % 4 == 0 else 0.7))
        if on['bell'] and b % 2 == 0:
            motif = [(0.0, chord['arp'][2]), (1.5, chord['arp'][1]), (3.0, chord['arp'][3])]
            for off, nm in motif:  # offsets in beats
                place(music, pan(bell(nm), 0.15), t0 + off * BEAT, 0.18)

    for b in risers_at:
        place(music, pan(riser(BAR), 0.0), b * BAR - BAR, 0.16)
    for b in crash_at:
        place(drums, pan(crash(), -0.1), b * BAR, 0.32)

    # final hit: kick + crash + full chord ringing out through the tail
    tb = end_hit_bar * BAR
    place(drums, K, tb, 1.0)
    place(drums, pan(crash(), 0.0), tb, 0.45)
    chord = PROGRESSION[0]
    ring = pad_chord(chord['pad'], tail + 0.2, 3200) * env_ad(int((tail + 0.2) * SR), 0.01, tail / 2.2)[:, None]
    place(music, ring, tb, 0.55)
    for nm in ('C5', 'E5', 'G5', 'C6'):
        place(music, pan(bell(nm, tail), 0), tb, 0.12)

    music *= side[:, None]
    mix = reverb(music, 0.28, seed=3)[:n] + reverb(drums, 0.10, seconds=1.2, decay=0.3, seed=5)[:n]
    # tidy the sub (phones can't play it anyway) and add a little air
    for c in range(2):
        mix[:, c] = highpass(mix[:, c], 40)
        mix[:, c] += 0.35 * highpass(mix[:, c], 3500)
    mix = np.tanh(mix * 0.9) / 0.9
    # gentle fade over the last 0.6 s
    f = int(0.6 * SR)
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    return mix


# ---------------------------------------------------------------- sound effects

def sfx_whoosh(seconds: float = 0.55, up: bool = True) -> np.ndarray:
    t = t_axis(seconds)
    n = rng.standard_normal(len(t))
    f0, f1 = (400, 5000) if up else (5000, 400)
    x = sweep_filter(n, f0, f1, q=2.2)
    e = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.6
    x = x * e
    l = x * np.linspace(0.4, 1.0, len(t))
    r = x * np.linspace(1.0, 0.4, len(t))
    return np.stack([l, r], axis=1)


def sfx_pop() -> np.ndarray:
    t = t_axis(0.16)
    f = 420 + 900 * (1 - np.exp(-t / 0.02))
    ph = np.cumsum(f) / SR
    return np.sin(2 * np.pi * ph) * env_ad(len(t), 0.002, 0.035)


def sfx_tap() -> np.ndarray:
    t = t_axis(0.07)
    n = bandpass(rng.standard_normal(len(t)), 1800, 6000)
    body = np.sin(2 * np.pi * 900 * t) * 0.6
    return (n * 0.6 + body) * env_ad(len(t), 0.0008, 0.012)


def sfx_type() -> np.ndarray:
    t = t_axis(0.05)
    n = bandpass(rng.standard_normal(len(t)), 2500, 7000)
    return n * env_ad(len(t), 0.0005, 0.008)


def sfx_success() -> np.ndarray:
    a = bell('E6', 1.0)
    b = bell('A6', 1.2)
    out = np.zeros(int(1.4 * SR))
    out[: len(a)] += a * 0.8
    i = int(0.11 * SR)
    out[i:i + len(b)] += b[: len(out) - i]
    return reverb(out, 0.25, seconds=1.2, decay=0.35, seed=11)[: len(out)]


def sfx_notify() -> np.ndarray:
    out = np.zeros(int(0.9 * SR))
    for k, nm in enumerate(('B5', 'E6')):
        x = bell(nm, 0.7) * (0.9 if k else 0.7)
        i = int(k * 0.12 * SR)
        out[i:i + len(x)] += x[: len(out) - i]
    return reverb(out, 0.2, seconds=0.9, decay=0.25, seed=12)[: len(out)]


def sfx_coins() -> np.ndarray:
    out = np.zeros(int(1.2 * SR))
    for k, nm in enumerate(('E6', 'G#6', 'B6', 'E7')):
        x = bell(nm, 0.6) * (0.55 + 0.1 * k)
        i = int(k * 0.055 * SR)
        out[i:i + len(x)] += x[: len(out) - i]
    t = t_axis(len(out) / SR)
    sh = highpass(rng.standard_normal(len(out)), 6000) * np.exp(-t / 0.06) * 0.25
    return reverb(out + sh, 0.22, seconds=1.0, decay=0.3, seed=13)[: len(out)]


def sfx_shutter() -> np.ndarray:
    out = np.zeros(int(0.25 * SR))
    for off, g in ((0.0, 1.0), (0.075, 0.7)):
        t = t_axis(0.06)
        c = bandpass(rng.standard_normal(len(t)), 1200, 7000) * env_ad(len(t), 0.0005, 0.01) * g
        thump = np.sin(2 * np.pi * 180 * t) * env_ad(len(t), 0.001, 0.015) * 0.5 * g
        i = int(off * SR)
        out[i:i + len(t)] += c + thump
    return out


def sfx_impact() -> np.ndarray:
    t = t_axis(1.6)
    f = 38 + 70 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45)
    n = lowpass(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.12) * 0.5
    x = np.tanh((sub + n) * 1.5)
    return reverb(x, 0.35, seconds=1.6, decay=0.5, seed=14)[: len(t)]


def sfx_riser(seconds: float = 1.0) -> np.ndarray:
    r = riser(seconds)
    t = t_axis(seconds)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / seconds) ** 2) / SR) * (t / seconds) ** 2 * 0.25
    return np.stack([r + tone, r * 0.9 + tone], axis=1)


def sfx_flip() -> np.ndarray:
    w = sfx_whoosh(0.42, up=True)
    t = t_axis(0.42)
    flutter = (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 26 * t)))[:, None]
    return w * flutter


def sfx_swipe() -> np.ndarray:
    return sfx_whoosh(0.28, up=False) * 0.8


# ---------------------------------------------------------------- main

def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    # Promo: 12 bars (24 s) + 1 s ring-out = 25 s
    promo = (['lift']                # 0     hook
             + ['drop'] * 4          # 1-4   rent-don't-buy, everything nearby
             + ['groove'] * 4        # 5-8   map, trust
             + ['drop'] * 3)         # 9-11  owner earnings, CTA
    write_wav('music-promo.wav', render_track(promo, tail=1.0, risers_at=[1, 5, 9],
                                              crash_at=[1, 5, 9], end_hit_bar=12), peak_db=-1.5)

    # Explainer: 41 bars (82 s) + 1 s ring-out = 83 s
    expl = (['intro'] * 3            # 0-2   logo + hook
            + ['lift'] * 3           # 3-5   two sides + chapter card
            + ['groove'] * 15        # 6-20  renter steps
            + ['break']              # 21    flip to owner
            + ['groove'] * 14        # 22-35 owner steps
            + ['drop'] * 5)          # 36-40 recap + CTA
    write_wav('music-explainer.wav', render_track(expl, tail=1.0, risers_at=[6, 22, 36],
                                                  crash_at=[6, 22, 36], end_hit_bar=41, arp_gain=0.7),
              peak_db=-1.5)

    write_wav('whoosh.wav', sfx_whoosh(), -3)
    write_wav('swipe.wav', sfx_swipe(), -6)
    write_wav('pop.wav', sfx_pop(), -6)
    write_wav('tap.wav', sfx_tap(), -6)
    write_wav('type.wav', sfx_type(), -10)
    write_wav('success.wav', sfx_success(), -4)
    write_wav('notify.wav', sfx_notify(), -4)
    write_wav('coins.wav', sfx_coins(), -4)
    write_wav('shutter.wav', sfx_shutter(), -5)
    write_wav('impact.wav', sfx_impact(), -2)
    write_wav('riser.wav', sfx_riser(1.0), -4)
    write_wav('flip.wav', sfx_flip(), -4)


if __name__ == '__main__':
    main()
