"""Découpe la planche d'expressions de Kael en 12 portraits détourés (fond transparent).

Pour chaque case : on coupe au-dessus de l'étiquette, puis on rend transparent le fond clair
par « remplissage » depuis les bords (le fond touche les bords, pas l'intérieur du personnage,
qui est entouré d'un trait sombre). Le bas est fondu en dégradé pour une incrustation douce.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image

SOURCE = Path(sys.argv[1])
SORTIE = Path(sys.argv[2])
SORTIE.mkdir(parents=True, exist_ok=True)

NOMS = [
    "neutre", "sur-de-lui", "sourire-en-coin", "amuse",
    "heureux", "sceptique", "agace", "colere",
    "gene", "inquiet", "determine", "surpris",
]
COLONNES = [(30, 323), (333, 622), (630, 920), (928, 1224)]
RANGEES = [(107, 477), (488, 847), (857, 1226)]
MARGE = 10

img = Image.open(SOURCE).convert("RGBA")
px_src = img.load()


def est_fond(p):
    r, g, b = p[:3]
    return r > 222 and g > 215 and b > 205 and max(r, g, b) - min(r, g, b) < 30


def est_etiquette(p):
    r, g, b = p[:3]
    return r < 95 and g < 85 and b < 80 and abs(r - g) < 25


def haut_etiquette(x0, x1, y0, y1):
    """Première ligne (en partant du milieu de la case) occupée à 60 % par le bandeau sombre."""
    largeur = x1 - x0
    for y in range(y0 + (y1 - y0) // 2, y1):
        sombres = sum(1 for x in range(x0 + largeur // 5, x1 - largeur // 5) if est_etiquette(px_src[x, y]))
        if sombres > 0.6 * (largeur * 3 // 5):
            return y
    return y1


for i, nom in enumerate(NOMS):
    cx0, cx1 = COLONNES[i % 4]
    cy0, cy1 = RANGEES[i // 4]
    x0, x1, y0 = cx0 + MARGE, cx1 - MARGE, cy0 + MARGE
    y1 = haut_etiquette(cx0, cx1, cy0, cy1) - 4
    case = img.crop((x0, y0, x1, y1))
    w, h = case.size
    px = case.load()

    # Remplissage depuis tous les bords : le fond clair devient transparent.
    vu = [[False] * h for _ in range(w)]
    file = deque()
    for x in range(w):
        file.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        file.extend([(0, y), (w - 1, y)])
    while file:
        x, y = file.popleft()
        if not (0 <= x < w and 0 <= y < h) or vu[x][y]:
            continue
        vu[x][y] = True
        if not est_fond(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        file.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # Bord doux : les pixels presque blancs collés au fond deviennent semi-transparents.
    for x in range(w):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a and r > 200 and g > 195 and b > 185 and any(
                0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] == 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                px[x, y] = (r, g, b, 90)

    # Incrustation : le bas (épaules, écharpe) s'efface en dégradé.
    debut = int(h * 0.72)
    for y in range(debut, h):
        facteur = 1 - (y - debut) / (h - debut)
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, int(a * facteur))

    case = case.crop(case.getbbox())
    case.save(SORTIE / f"{nom}.png", optimize=True)
    print(nom, case.size)

# Planche de contrôle sur fond sombre (pour vérifier le détourage).
apercus = [Image.open(SORTIE / f"{n}.png") for n in NOMS]
cw = max(a.width for a in apercus)
ch = max(a.height for a in apercus)
planche = Image.new("RGBA", (cw * 4 + 50, ch * 3 + 40), (9, 12, 17, 255))
for i, a in enumerate(apercus):
    planche.alpha_composite(a, (10 + (i % 4) * (cw + 10), 10 + (i // 4) * (ch + 10)))
planche.convert("RGB").save(SORTIE / "_controle.png")
