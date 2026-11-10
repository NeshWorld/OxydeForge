"""Découpe une planche de Kael DÉJÀ transparente (4 colonnes × 3 rangées) en 12 portraits.

Usage : python scripts/decoupe_kael_transparent.py planche.webp src/assets/kael

Ordre des cases, ligne par ligne : neutre, sur-de-lui, sourire-en-coin, amuse,
heureux, sceptique, agace, colere, gene, inquiet, determine, surpris.
Le bas (épaules) s'efface en dégradé pour s'incruster dans la bulle de Kael.
"""
import sys
from pathlib import Path

from PIL import Image

NOMS = [
    "neutre", "sur-de-lui", "sourire-en-coin", "amuse",
    "heureux", "sceptique", "agace", "colere",
    "gene", "inquiet", "determine", "surpris",
]

source = Image.open(sys.argv[1]).convert("RGBA")
sortie = Path(sys.argv[2])
sortie.mkdir(parents=True, exist_ok=True)
largeur, hauteur = source.width / 4, source.height / 3

for i, nom in enumerate(NOMS):
    case = source.crop((
        round((i % 4) * largeur), round((i // 4) * hauteur),
        round((i % 4 + 1) * largeur), round((i // 4 + 1) * hauteur),
    ))
    # Le cadre au plus près du personnage (on ignore les pixels presque invisibles).
    masque = case.getchannel("A").point(lambda a: 255 if a > 16 else 0)
    case = case.crop(masque.getbbox())

    # Incrustation : le dernier quart (les épaules) s'efface en dégradé.
    px = case.load()
    w, h = case.size
    debut = int(h * 0.75)
    for y in range(debut, h):
        facteur = 1 - (y - debut) / (h - debut)
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, int(a * facteur))

    case.save(sortie / f"{nom}.png", optimize=True)
    print(nom, case.size)
