"""Rendu des pages du PDF en PNG pour contrôle visuel (outil interne)."""
import os
import sys

import pypdf
import pymupdf

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
os.makedirs(out_dir, exist_ok=True)

reader = pypdf.PdfReader(pdf_path)
print("pages:", len(reader.pages))
print("meta:", dict(reader.metadata))
box = reader.pages[0].mediabox
print("mediabox pt:", float(box.width), float(box.height))

doc = pymupdf.open(pdf_path)
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=110)
    pix.save(os.path.join(out_dir, f"p{i + 1:02d}.png"))
print("rendered", len(doc))
