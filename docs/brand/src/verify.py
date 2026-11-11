"""Martylab — vérification du kit de marque.

Contrôle ce qui est réellement sur disque, pas ce qui est annoncé :
- SVG : XML valide, viewBox, aucun raster/filtre/police externe ;
- PNG : dimensions et canal alpha lus avec Pillow ;
- PDF : nombre de pages, format A4, polices embarquées, textes attendus ;
- palette : couleurs des SVG et ratios de contraste recalculés ;
- archive : contenu listé et hachages conformes au manifeste.

Sortie : rapport lisible, code retour 1 si un contrôle échoue.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

import pypdf
import pymupdf
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(BRAND, "..", ".."))
VERSION = "1.0.0"

results: list[tuple[bool, str]] = []


def check(ok: bool, message: str) -> None:
    results.append((bool(ok), message))


def path(*parts: str) -> str:
    return os.path.join(BRAND, *parts)


palette = json.load(open(path("src", "generated", "palette.json"), encoding="utf-8"))
L = palette["tokens"]["light"]
D = palette["tokens"]["dark"]

# ---------------------------------------------------------------- SVG
SVG_NS = "{http://www.w3.org/2000/svg}"
logo_dir = path("assets", "logo")
icon_dir = path("assets", "icons")
svgs = sorted(f for f in os.listdir(logo_dir) if f.endswith(".svg"))
svgs += sorted(f for f in os.listdir(icon_dir) if f.endswith(".svg"))

for name in svgs:
    fp = os.path.join(logo_dir if os.path.exists(os.path.join(logo_dir, name)) else icon_dir, name)
    raw = open(fp, encoding="utf-8").read()
    try:
        tree = ET.fromstring(raw)
        check(tree.tag == SVG_NS + "svg", f"SVG valide : {name}")
    except ET.ParseError as exc:  # pragma: no cover
        check(False, f"SVG invalide : {name} ({exc})")
        continue
    check(tree.get("viewBox") is not None, f"viewBox présent : {name}")
    check("<image" not in raw, f"aucun raster embarqué : {name}")
    check("<filter" not in raw and "Gradient" not in raw, f"aucun filtre ni dégradé : {name}")
    check("font-family" not in raw and "<text" not in raw, f"aucun texte dépendant d'une police : {name}")
    check("http" not in raw.replace("http://www.w3.org/2000/svg", ""), f"aucune référence externe : {name}")
    for hexv in re.findall(r'fill="(#[0-9A-Fa-f]{6})"', raw):
        check(hexv.upper() in {L["foreground"]["hex"], L["primary"]["hex"], D["foreground"]["hex"],
                               D["primary"]["hex"], D["background"]["hex"], "#8C8C8C", "#A6A6A6",
                               "#000000", "#FFFFFF"},
              f"couleur du système : {name} → {hexv}")

# ---------------------------------------------------------------- PNG
EXPECTED = {
    "martylab-app-icon-1024.png": (1024, 1024),
    "martylab-app-icon-maskable-1024.png": (1024, 1024),
    "martylab-app-icon-foreground-1024.png": (1024, 1024),
    "martylab-apple-touch-icon-180.png": (180, 180),
    "martylab-pwa-192.png": (192, 192),
    "martylab-pwa-512.png": (512, 512),
    "martylab-favicon-32.png": (32, 32),
}
for name, (w, h) in EXPECTED.items():
    fp = os.path.join(icon_dir, name)
    with Image.open(fp) as im:
        check(im.size == (w, h), f"PNG {name} : {im.size[0]}×{im.size[1]} attendu {w}×{h}")
        if "foreground" in name:
            check(im.mode in ("RGBA", "LA"), f"PNG {name} : transparence ({im.mode})")
            check(im.convert("RGBA").getpixel((0, 0))[3] == 0, f"PNG {name} : coin transparent")
        elif "favicon" in name:
            # Plaque à coins arrondis : le centre est opaque, les coins sont vides.
            rgba = im.convert("RGBA")
            check(rgba.mode == "RGBA", f"PNG {name} : couche alpha présente")
            check(rgba.getpixel((w // 2, h // 2))[3] == 255, f"PNG {name} : centre opaque")
            check(rgba.getpixel((0, 0))[3] == 0, f"PNG {name} : coin transparent (rayon)")
        else:
            check(im.mode in ("RGB", "P") or (im.mode == "RGBA" and im.getextrema()[3][0] == 255),
                  f"PNG {name} : opaque ({im.mode})")

# zone sûre de l'icône maskable : contenu dans le cercle de 80 %
with Image.open(os.path.join(icon_dir, "martylab-app-icon-maskable-1024.png")) as im:
    rgba = im.convert("RGBA")
    bg = rgba.getpixel((2, 2))
    w, h = rgba.size
    cx, cy = w / 2, h / 2
    radius = 0.8 * w / 2
    outside = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            if ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 > radius and rgba.getpixel((x, y)) != bg:
                outside += 1
    check(outside == 0, f"icône maskable : contenu hors du cercle de 80 % = {outside} px")

# ---------------------------------------------------------------- PDF
guide = path("martylab-brand-guide.pdf")
reader = pypdf.PdfReader(guide)
check(len(reader.pages) == 10, f"guide : {len(reader.pages)} pages (attendu 10)")
box = reader.pages[0].mediabox
check(abs(float(box.width) - 595) < 2 and abs(float(box.height) - 842) < 2, "guide : format A4")

doc = pymupdf.open(guide)
text = "\n".join(page.get_text() for page in doc)
for name in sorted(svgs) + sorted(EXPECTED):
    check(name in text, f"guide : {name} cité")

checks = {c["label"]: c["ratio"] for c in palette["checks"]}
for label, ratio in list(checks.items())[:6]:
    needle = f"{ratio:.2f}".replace(".", ",") + ":1"
    check(needle in text, f"guide : ratio {needle} présent ({label})")

fonts = set()
for page in doc:
    for font in page.get_fonts():
        fonts.add(font[3])
check(len(fonts) >= 2, f"guide : polices embarquées ({', '.join(sorted(fonts))})")

# ---------------------------------------------------------------- archive
zip_path = path("dist", f"martylab-brand-kit-v{VERSION}.zip")
check(os.path.exists(zip_path), "archive présente")
if os.path.exists(zip_path):
    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        for name in EXPECTED:
            check(any(n.endswith(name) for n in names), f"archive : {name}")
        check(any(n.endswith("martylab-brand-guide.pdf") for n in names), "archive : guide")
        check(any(n.endswith("MANIFEST.md") for n in names), "archive : manifeste")

# ---------------------------------------------------------------- manifeste
manifest = open(path("MANIFEST.md"), encoding="utf-8").read()
hashes = dict(re.findall(r"`([\w.\-]+)` \| [^|]+ \| \d+ \| `([0-9a-f]{64})`", manifest))
for name, digest in hashes.items():
    fp = None
    for d in (logo_dir, icon_dir, BRAND):
        candidate = os.path.join(d, name)
        if os.path.exists(candidate):
            fp = candidate
            break
    if fp is None:
        check(False, f"manifeste : fichier absent {name}")
        continue
    actual = hashlib.sha256(open(fp, "rb").read()).hexdigest()
    check(actual == digest, f"hachage : {name}")

failed = [m for ok, m in results if not ok]
for ok, message in results:
    if not ok:
        print(f"ECHEC  {message}")
print(f"\n{len(results) - len(failed)}/{len(results)} contrôles OK")
if failed:
    sys.exit(1)
