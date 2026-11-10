// Adapte la page construite par Vite au format d'un artefact claude.ai.
//
// Un artefact est enveloppé par la plateforme dans son propre squelette
// (<!doctype>, <html>, <head>, <body>) : la page publiée ne doit contenir que
// son titre, ses liens et son contenu. On garde donc l'essentiel de dist/index.html.
//
// Usage : node scripts/preparer_artefact.mjs <dossier construit par vite>

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dossier = process.argv[2];
const chemin = join(dossier, 'index.html');
const html = readFileSync(chemin, 'utf8');

// L'icône de l'onglet n'est pas reprise : l'artefact a sa propre icône (et le SVG de
// la nôtre contient des « > » qui gêneraient une recherche simple).
const titre = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>OxydeForge</title>';
const styles = html.match(/<link rel="stylesheet"[^>]*>/g) ?? [];
const scripts = html.match(/<script type="module"[^>]*><\/script>/g) ?? [];
if (!scripts.length) throw new Error('aucun script trouvé dans index.html');

const page = [titre, ...styles, '<div id="root"></div>', ...scripts, ''].join('\n');
writeFileSync(chemin, page);
console.log('Page d’artefact prête :\n' + page);
