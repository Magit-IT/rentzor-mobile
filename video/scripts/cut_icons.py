"""
Cut the 3D icons used by the Reels out of the app's icon sheets
(src/assets/shared/3d-iconlar-yaratish-image-may-13-2026-2.png and
src/assets/shared/category-icon.png) into public/icons/<name>.png.

The sheets have white backgrounds; the cut-outs keep a soft white matte, so
they are meant to sit on white tiles (see Tile3D). Run from video/:

    python3 scripts/cut_icons.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
SHEETS = {
    'a': 'src/assets/shared/3d-iconlar-yaratish-image-may-13-2026-2.png',
    'b': 'src/assets/shared/category-icon.png',
}
# name -> (sheet, bounding box found by connected-component analysis)
PICK = {
    'phone': ('a', (105, 76, 224, 260)), 'tablet': ('a', (299, 91, 457, 257)), 'watch': ('a', (540, 94, 689, 270)),
    'laptop': ('a', (61, 338, 255, 515)), 'gamepad': ('a', (90, 582, 277, 755)), 'camera': ('a', (98, 828, 269, 989)),
    'camera2': ('a', (335, 847, 492, 994)), 'lens': ('a', (765, 835, 881, 991)), 'headphones': ('a', (97, 1036, 243, 1216)),
    'speaker': ('a', (528, 1091, 707, 1216)), 'mic': ('a', (776, 1028, 878, 1224)), 'speakers': ('a', (963, 1053, 1147, 1215)),
    'sneakers': ('b', (70, 82, 226, 226)), 'treadmill': ('b', (254, 67, 402, 227)), 'dumbbells': ('b', (614, 91, 780, 233)),
    'scooter': ('b', (266, 275, 395, 433)), 'helmet': ('b', (812, 282, 945, 441)), 'bike': ('b', (70, 475, 224, 629)),
    'backpack': ('b', (81, 677, 207, 828)), 'mat': ('b', (433, 705, 590, 803)), 'kayak': ('b', (614, 696, 774, 814)),
    'gopro': ('b', (818, 681, 943, 825)), 'bike2': ('b', (620, 854, 770, 995)), 'drone_gopro': ('b', (808, 848, 946, 1001)),
}


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    sheets = {k: np.array(Image.open(os.path.join(ROOT, v)).convert('RGB')).astype(float) for k, v in SHEETS.items()}
    for name, (key, (x0, y0, x1, y1)) in PICK.items():
        im, pad = sheets[key], 14
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(im.shape[1], x1 + pad), min(im.shape[0], y1 + pad)
        crop = im[y0:y1, x0:x1]
        dist = np.abs(255 - crop).max(-1)
        # background = near-white pixels connected to the crop border
        labels, _ = ndimage.label(dist < 26)
        border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
        bg = np.isin(labels, list(border))
        alpha = ndimage.gaussian_filter(np.where(bg, np.clip((dist - 4) / 22, 0, 1) * 255, 255), 0.6)
        a = np.clip(alpha / 255, 1e-3, 1)[..., None]
        rgb = np.clip((crop - 255 * (1 - a)) / a, 0, 255)  # un-premultiply against white
        out = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')
        out.crop(out.getbbox()).save(os.path.join(OUT, f'{name}.png'), optimize=True)
        print('wrote', name)


if __name__ == '__main__':
    main()
