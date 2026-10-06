"""
Soundtrack (licensed CC BY track, cut to the 120 BPM grid) + synthesised UI
sound effects and sound logo for the Rentzor Reels.

The music is «Catchy Upbeat Pop» by Music for Creators (CC BY 4.0 — credit it
in the post caption); the effects are synthesised from oscillators and seeded
noise. Run from video/:

    python3 audio/build_audio.py

Writes public/audio/*.wav. Requires numpy, scipy and ffmpeg.

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


# ---------------------------------------------------------------- synths

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


# ---------------------------------------------------------------- music

# «Catchy Upbeat Pop» by Music for Creators — CC BY 4.0
# https://freemusicarchive.org/music/fretbound/pop-background-music/catchy-upbeat-pop/
# The track runs at ~118.0 BPM with its first beat at 0.483 s. It is sped up
# by 120/118.01 (≈1.7 %, inaudible) so its beats land on the videos' 120 BPM
# grid (15 frames per beat).
TRACK = os.path.join(os.path.dirname(__file__), '..', 'music', 'catchy-upbeat-pop.mp3')
TRACK_BPM = 118.01
TRACK_FIRST_BEAT = 0.483


def track_cut(start_beat: int, seconds: float, fade_in: float, fade_out: float) -> np.ndarray:
    """`seconds` of the track (at 120 BPM) starting exactly on beat `start_beat`."""
    import subprocess
    tempo = BPM / TRACK_BPM
    start = TRACK_FIRST_BEAT + start_beat * 60.0 / TRACK_BPM
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-ss', f'{start:.4f}', '-t', f'{seconds * tempo + 0.5:.3f}', '-i', TRACK,
         '-af', f'atempo={tempo:.6f}', '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'],
        capture_output=True, check=True).stdout
    x = np.frombuffer(raw, '<i2').reshape(-1, 2).astype(float) / 32768
    x = x[: int(seconds * SR)].copy()
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if fi:
        x[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    if fo:
        x[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    return x


def sonic_logo() -> np.ndarray:
    """Rentzor sound logo: a bright three-note rise (E5 → B5 → E6) with a soft shimmer."""
    out = np.zeros(int(1.8 * SR))
    for k, (nm, g) in enumerate((('E5', 0.7), ('B5', 0.75), ('E6', 0.9))):
        x = bell(nm, 1.4) * g
        i = int(k * 0.13 * SR)
        out[i:i + len(x)] += x[: len(out) - i]
    t = t_axis(len(out) / SR)
    shimmer = highpass(rng.standard_normal(len(out)), 7000) * np.exp(-np.maximum(t - 0.26, 0) / 0.35) * (t > 0.26) * 0.08
    return reverb(out + shimmer, 0.3, seconds=1.6, decay=0.45, seed=21)[: len(out)]


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

    # Promo (25 s): straight into the full-energy section (beat 96 ≈ 0:49).
    write_wav('music-promo.wav', track_cut(96, 25.0, 0.02, 1.6), peak_db=-1.0)
    # Explainer (87 s): from the top — the softer intro sits under the logo.
    write_wav('music-explainer.wav', track_cut(0, 87.5, 0.0, 2.5), peak_db=-1.0)

    write_wav('logo.wav', sonic_logo(), -3)
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
