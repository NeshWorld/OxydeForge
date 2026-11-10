// Ta progression, gardée dans le navigateur de la fenêtre (localStorage).
export interface Progress {
  done: Record<string, boolean>;
  drafts: Record<string, string>;
}

const KEY = 'oxydeforge.progress';
export const EMPTY_PROGRESS: Progress = { done: {}, drafts: {} };

export function loadProgress(): Progress {
  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return EMPTY_PROGRESS;
  }
}

const SIDEBAR_KEY = 'oxydeforge.sidebarCollapsed';

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  } catch {
    // Pas de stockage : le menu revient déplié au prochain lancement.
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Stockage indisponible : la progression ne sera pas gardée, l'app marche quand même.
  }
}
