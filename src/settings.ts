// Les réglages, gardés dans le navigateur de la fenêtre (comme dans Nullforge).
const KEY = 'oxydeforge.settings.v1';

export interface Settings {
  // 1 = taille d'origine.
  textScale: number;
  // false : le chapitre ownership ne montre que son intro (own-01 + le lingot).
  ownershipComplet: boolean;
}

export const TEXT_SIZES = [
  { label: 'Normal', scale: 1 },
  { label: '+15 %', scale: 1.15 },
  { label: '+30 %', scale: 1.3 },
  { label: '+65 %', scale: 1.65 },
];

const DEFAULT_SETTINGS: Settings = { textScale: 1, ownershipComplet: false };

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // stockage indisponible ou illisible : réglages par défaut
  }
  return DEFAULT_SETTINGS;
}

let current = loadSettings();

export function getSettings() {
  return current;
}

export function updateSettings(change: Partial<Settings>) {
  current = { ...current, ...change };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // les réglages reviendront simplement par défaut à la prochaine ouverture
  }
  applyTextScale();
  return current;
}

// Tous les textes sont en rem : changer la taille de la racine les met à l'échelle ensemble.
export function applyTextScale() {
  document.documentElement.style.fontSize = `${current.textScale * 100}%`;
}
