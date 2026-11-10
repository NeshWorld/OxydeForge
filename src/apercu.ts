import { parse } from 'smol-toml';
import type { Catalogue, Exercice, Module } from './types';

// Aperçu navigateur uniquement : imite charger_catalogue() du Rust.
const fichiers = import.meta.glob('../exercices/*.toml', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

export function apercuNavigateur(): Catalogue {
  const noms = Object.keys(fichiers).sort();
  const modulesFichier = noms.find((n) => n.endsWith('/modules.toml'))!;
  const modules = (parse(fichiers[modulesFichier]) as unknown as { modules: Module[] }).modules;
  const exercices = noms
    .filter((n) => n !== modulesFichier)
    .map((n) => {
      const brut = parse(fichiers[n]) as unknown as Partial<Exercice>;
      return {
        chaine: null,
        intro: false,
        code_casse: null,
        erreur: null,
        kael: null,
        humeur: null,
        digression: null,
        sortie_attendue: null,
        erreur_corrigee: null,
        criteres: [],
        indices: [],
        ...brut,
      } as Exercice;
    })
    .sort((a, b) => modules.findIndex((m) => m.id === a.module) - modules.findIndex((m) => m.id === b.module));
  return { modules, exercices };
}
