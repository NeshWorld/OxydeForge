// La progression en ligne, quand OxydeForge tourne comme artefact claude.ai.
//
// Elle vit dans le dossier PRIVÉ du joueur : data/users/<son id>/progress.
// Personne d'autre ne peut la lire, pas même le propriétaire de l'artefact.
// Dans la fenêtre Tauri (ou un navigateur ordinaire), window.claude n'existe pas :
// tout reste dans le localStorage, comme avant.

import type { Progress } from './progress';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Unsubscribe = () => void;

export type EtatCloud = 'absent' | 'connexion' | 'synchronise' | 'hors-ligne';

interface Cloud {
  /** Écoute la progression enregistrée (une seule fois au démarrage). */
  ecouter(recu: (p: Partial<Progress>) => void, etat: (e: EtatCloud) => void): Unsubscribe;
  /** Enregistre la progression (regroupée : une écriture par pause). */
  enregistrer(p: Progress): void;
}

const DELAI_ECRITURE_MS = 1500;

export async function ouvrirCloud(): Promise<Cloud | null> {
  const claude = (window as any).claude;
  if (!claude?.use) return null;
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  if (!db || !user) return null;
  const id: string | null = await user.id();
  if (!id) return null;

  const ref = db.doc(`data/users/${id}/progress`);
  let dernierEnvoye = '';
  let enAttente: Progress | null = null;
  let minuteur: ReturnType<typeof setTimeout> | null = null;
  let ecritureEnCours = false;
  // Pas d'écriture avant d'avoir reçu la version en ligne : sinon une progression
  // vide (nouvel appareil, cache effacé) écraserait celle qui est enregistrée.
  let recue = false;

  // Une seule écriture à la fois, et seulement si quelque chose a changé.
  const vider = async () => {
    minuteur = null;
    if (!recue || ecritureEnCours || !enAttente) return;
    const corps = JSON.stringify(enAttente);
    enAttente = null;
    if (corps === dernierEnvoye) return;
    ecritureEnCours = true;
    try {
      await ref.set(JSON.parse(corps));
      dernierEnvoye = corps;
    } catch {
      // Écriture refusée ou réseau coupé : la progression reste dans le localStorage.
    }
    ecritureEnCours = false;
    if (enAttente) vider();
  };

  return {
    ecouter(recu, etat) {
      etat('connexion');
      const delai = setTimeout(() => etat('hors-ligne'), 10_000);
      return ref.onSnapshot(
        (snap: any) => {
          if (snap.exists) {
            const data = snap.data() as Partial<Progress>;
            dernierEnvoye = JSON.stringify(data);
            recu(data);
          }
          if (!snap.metadata.fromCache) {
            clearTimeout(delai);
            etat('synchronise');
            if (!recue) {
              recue = true;
              if (enAttente) vider();
            }
          }
        },
        () => {
          clearTimeout(delai);
          etat('hors-ligne');
        },
      );
    },
    enregistrer(p) {
      enAttente = p;
      if (minuteur) clearTimeout(minuteur);
      minuteur = setTimeout(vider, DELAI_ECRITURE_MS);
    },
  };
}

/** Fusionne la progression en ligne et celle de cet appareil : rien de réussi ne se perd. */
export function fusionner(local: Progress, distant: Partial<Progress>): Progress {
  return {
    done: { ...(distant.done ?? {}), ...local.done },
    drafts: { ...(distant.drafts ?? {}), ...local.drafts },
  };
}
