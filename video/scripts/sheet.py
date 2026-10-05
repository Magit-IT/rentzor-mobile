# Combine rendered stills into contact sheets for review.
import glob, sys
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1]))
out = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
per = int(sys.argv[4]) if len(sys.argv) > 4 else 12
for k in range(0, len(files), per):
    chunk = files[k:k + per]
    ims = [Image.open(f) for f in chunk]
    w, h = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + 8), rows * (h + 30)), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        x, y = (i % cols) * (w + 8), (i // cols) * (h + 30)
        sheet.paste(im, (x, y))
        d.text((x + 6, y + h + 6), chunk[i].split('-')[-1], fill=(255, 255, 255))
    sheet.save(out.replace('.png', f'_{k // per}.png'))
    print('sheet', out.replace('.png', f'_{k // per}.png'), sheet.size)
