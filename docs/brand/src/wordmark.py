"""Martylab — extraction du logotype « Martylab » en tracés SVG.

Source : Bricolage Grotesque Variable (SIL OFL 1.1), fichier latin de
`@fontsource-variable/bricolage-grotesque`. Instance wght = 600, interlettrage
-0.02em (règle display déjà appliquée dans apps/portal/src/index.css).

Sortie : generated/wordmark.json — chemin SVG final (y vers le bas, ligne de
base à y = 0), largeur, hauteur de capitale, métriques.
"""
import json
import os

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FONT = os.path.join(
    ROOT,
    "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
)
TEXT = "Martylab"
SIZE = 100.0
WEIGHT = 600
TRACKING_EM = -0.02

font = TTFont(FONT)
instantiateVariableFont(font, {"wght": WEIGHT}, inplace=True)
font["OS/2"].usWeightClass = WEIGHT

upem = font["head"].unitsPerEm
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
hmtx = font["hmtx"]
order = font.getGlyphOrder()

scale = SIZE / upem
tracking = TRACKING_EM * SIZE

parts = []
x = 0.0
for ch in TEXT:
    gname = cmap[ord(ch)]
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    # y vers le bas : mise à l'échelle positive en x, négative en y.
    tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x, 0))
    glyph_set[gname].draw(tpen)
    d = pen.getCommands()
    if d:
        parts.append(d)
    x += hmtx[gname][0] * scale + tracking

width = x - tracking

# Hauteur de capitale : borne haute du « H ».
from fontTools.pens.boundsPen import BoundsPen

bp = BoundsPen(glyph_set)
glyph_set[cmap[ord("H")]].draw(bp)
cap_height = bp.bounds[3] * scale

bp2 = BoundsPen(glyph_set)
glyph_set[cmap[ord("y")]].draw(bp2)
descender = bp2.bounds[1] * scale  # négatif

# Boîte englobante réelle de tous les glyphes, en espace texte (y vers le bas,
# ligne de base à 0).
bounds = [0.0, 0.0, 0.0, 0.0]
first = True
x = 0.0
for ch in TEXT:
    gname = cmap[ord(ch)]
    b = BoundsPen(glyph_set)
    glyph_set[gname].draw(b)
    if b.bounds:
        x0, y0, x1, y1 = b.bounds
        bx0 = x + x0 * scale
        bx1 = x + x1 * scale
        by0 = -y1 * scale
        by1 = -y0 * scale
        if first:
            bounds = [bx0, by0, bx1, by1]
            first = False
        else:
            bounds = [
                min(bounds[0], bx0),
                min(bounds[1], by0),
                max(bounds[2], bx1),
                max(bounds[3], by1),
            ]
    x += hmtx[gname][0] * scale + tracking

out = {
    "font": "Bricolage Grotesque Variable",
    "license": "SIL Open Font License 1.1",
    "weight": WEIGHT,
    "trackingEm": TRACKING_EM,
    "size": SIZE,
    "upem": upem,
    "text": TEXT,
    "path": " ".join(parts),
    "width": round(width, 3),
    "capHeight": round(cap_height, 3),
    "descender": round(descender, 3),
    "bbox": [round(v, 3) for v in bounds],
    "ascender": round(-bounds[1], 3),
    "glyphCount": len(order),
}
os.makedirs(os.path.join(HERE, "generated"), exist_ok=True)
with open(os.path.join(HERE, "generated", "wordmark.json"), "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)

print(json.dumps({k: out[k] for k in ("width", "capHeight", "descender", "size")}, indent=2))
print("path chars:", len(out["path"]))
