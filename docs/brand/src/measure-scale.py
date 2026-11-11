"""Mesure l'échelle appliquée par Chrome : bbox du contenu sur la page 1."""
import io
import sys

import pymupdf
from PIL import Image

pdf = sys.argv[1]
doc = pymupdf.open(pdf)
page = doc[0]
pix = page.get_pixmap(dpi=72)
im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
w, h = im.size
xs = [x for x in range(w) if im.getpixel((x, h // 2)) != (255, 255, 255)]
ys = [y for y in range(h) if im.getpixel((w // 2, y)) != (255, 255, 255)]
if not xs or not ys:
    print("empty")
    sys.exit(0)
bw = max(xs) + 1
bh = max(ys) + 1
print(f"page {w}x{h} content {bw}x{bh} scale_w={bw / w:.4f} scale_h={bh / h:.4f}")
