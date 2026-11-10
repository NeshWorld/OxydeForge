import { invoke, isTauri } from '@tauri-apps/api/core';
import type { Progress } from './progress';
import type { Catalogue, Execution, Verdict } from './types';

export const DANS_TAURI = isTauri();

// Dans la fenêtre Tauri, la progression vit dans un fichier géré par le Rust
// (src-tauri/src/progression.rs). `null` : pas encore de fichier.
export const lireProgressionFichier = () => invoke<Partial<Progress> | null>('lire_progression');
export const ecrireProgressionFichier = (progression: Progress) => invoke<void>('ecrire_progression', { progression });

// Dans la fenêtre Tauri : c'est le Rust qui lit les fichiers (commande charger_catalogue).
// Dans un simple navigateur (aperçu `npm run dev`), il n'y a pas de Rust :
// on lit les mêmes fichiers TOML côté JavaScript, pour pouvoir travailler l'interface.
export async function chargerCatalogue(): Promise<Catalogue> {
  if (DANS_TAURI) return invoke<Catalogue>('charger_catalogue');
  const { apercuNavigateur } = await import('./apercu');
  return apercuNavigateur();
}

// Les adresses vivent côté Rust (src-tauri/src/liens.rs) ; ici, seulement pour le navigateur.
const LIENS = { std: 'https://doc.rust-lang.org/std/index.html' } as const;

export async function ouvrirLien(nom: keyof typeof LIENS): Promise<void> {
  if (DANS_TAURI) return invoke('ouvrir_lien', { nom });
  window.open(LIENS[nom], '_blank', 'noopener');
}

const SANS_RUST = 'La compilation ne marche que dans la fenêtre OxydeForge (npm run app), pas dans un navigateur.';

export async function executer(code: string): Promise<Execution> {
  if (!DANS_TAURI) throw new Error(SANS_RUST);
  return invoke<Execution>('executer', { code });
}

export async function verifier(id: string, code: string): Promise<Verdict> {
  if (!DANS_TAURI) throw new Error(SANS_RUST);
  return invoke<Verdict>('verifier', { id, code });
}
