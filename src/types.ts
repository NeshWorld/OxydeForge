// Miroir TypeScript des structs Rust de src-tauri/src/exercices.rs.
// Si tu ajoutes un champ côté Rust, ajoute-le aussi ici.

export type TypeExercice = 'lecon' | 'lis-erreur' | 'introspection' | 'defi' | 'demo' | 'etape';

/** Les 12 visages de Kael (fichiers de src/assets/kael/). */
export type Humeur =
  | 'neutre'
  | 'sur-de-lui'
  | 'sourire-en-coin'
  | 'amuse'
  | 'heureux'
  | 'sceptique'
  | 'agace'
  | 'colere'
  | 'gene'
  | 'inquiet'
  | 'determine'
  | 'surpris';

export interface Module {
  id: string;
  titre: string;
  accroche: string;
  /** Un projet : étapes verrouillées l'une après l'autre, code repris d'une étape à la suivante. */
  projet?: boolean;
}

export interface Exercice {
  id: string;
  module: string;
  titre: string;
  notion: string;
  type: TypeExercice;
  /** Mini-projet dans un module normal : les étapes de même chaîne s'enchaînent. */
  chaine: string | null;
  /** Reste visible même quand le reste du chapitre est masqué. */
  intro: boolean;
  kael: string | null;
  humeur: Humeur | null;
  lecon: string;
  digression: string | null;
  mission: string;
  code_casse: string | null;
  erreur: string | null;
  sortie_attendue: string | null;
  erreur_corrigee: string | null;
  criteres: string[];
  indices: string[];
  solution: string;
}

// Miroir de src-tauri/src/compilation.rs.
export interface Execution {
  compile: boolean;
  compilateur: string;
  codes_erreur: string[];
  sortie: string;
  sortie_erreur: string;
  code_sortie: number | null;
  trop_long: boolean;
  duree_compilation_ms: number;
  duree_execution_ms: number;
}

export interface Critere {
  label: string;
  ok: boolean;
  detail: string | null;
}

export interface Verdict {
  execution: Execution;
  criteres: Critere[];
  reussi: boolean;
}

export interface Catalogue {
  modules: Module[];
  exercices: Exercice[];
}
