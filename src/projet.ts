// Les projets : des étapes qui s'enchaînent.
// Deux façons d'en faire un :
//   - un module entier marqué `projet = true` dans exercices/modules.toml (César) ;
//   - quelques exercices d'un module normal qui partagent la même `chaine` (le lingot, dans ownership).
// Les étapes se débloquent l'une après l'autre, et chaque étape s'ouvre
// avec TON code de l'étape précédente (jamais la solution).
import type { Catalogue, Exercice } from './types';

/** L'étape juste avant celle-ci dans le même projet, ou null (pas un projet, ou 1re étape). */
export function etapePrecedente(catalogue: Catalogue, exercice: Exercice): Exercice | null {
  const module = catalogue.modules.find((m) => m.id === exercice.module);
  let etapes: Exercice[];
  if (module?.projet) etapes = catalogue.exercices.filter((e) => e.module === module.id);
  else if (exercice.chaine) etapes = catalogue.exercices.filter((e) => e.chaine === exercice.chaine);
  else return null;
  return etapes[etapes.indexOf(exercice) - 1] ?? null;
}

/** Une étape reste verrouillée tant que la précédente n'est pas réussie. */
export function estVerrouille(catalogue: Catalogue, exercice: Exercice, done: Record<string, boolean>): boolean {
  const precedente = etapePrecedente(catalogue, exercice);
  return precedente !== null && !done[precedente.id];
}
