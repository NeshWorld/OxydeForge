import { useEffect, useRef } from 'react';
import type { Humeur, TypeExercice } from '../types';

// Kael, technicien de la fonderie : un peu gauche, distrait, mais jovial et chaleureux.
// Ses 12 visages sont dans src/assets/kael/ (découpés par scripts/decoupe_kael.py).

const VISAGES = import.meta.glob('../assets/kael/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export function visage(humeur: Humeur) {
  return VISAGES[`../assets/kael/${humeur}.png`];
}

// Précharge tous les visages : un changement d'humeur s'affiche sans délai.
for (const url of Object.values(VISAGES)) new Image().src = url;

const ETIQUETTE: Record<TypeExercice, string> = {
  lecon: 'Bon de travail',
  'lis-erreur': 'Panne',
  defi: 'Commande spéciale',
  introspection: 'Inspection',
  demo: 'Visite',
  etape: 'Chantier',
};

/** L'humeur de Kael quand le TOML n'en précise pas. */
export const HUMEUR_PAR_DEFAUT: Record<TypeExercice, Humeur> = {
  lecon: 'neutre',
  'lis-erreur': 'inquiet',
  defi: 'determine',
  introspection: 'sceptique',
  demo: 'sourire-en-coin',
  etape: 'determine',
};

/** Le visage de Kael, détouré, sans cadre. `secousse` : il sursaute à chaque changement. */
export function KaelFace({ humeur, secousse = 0 }: { humeur: Humeur; secousse?: number }) {
  const face = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!secousse || !face.current) return;
    const el = face.current;
    el.classList.remove('shake');
    void el.offsetWidth; // relance l'animation même si elle vient d'être jouée
    el.classList.add('shake');
  }, [secousse]);
  return (
    <span ref={face} className="kael-face" aria-hidden>
      <img src={visage(humeur)} alt="" />
    </span>
  );
}

interface CardProps {
  type: TypeExercice;
  texte: string;
  humeur: Humeur;
  secousse?: number;
}

export function KaelCard({ type, texte, humeur, secousse }: CardProps) {
  return (
    <aside className={`kael-card kael-${type}`}>
      <KaelFace humeur={humeur} secousse={secousse} />
      <div className="kael-body">
        <p className="kael-label">
          {ETIQUETTE[type]} <span>· Kael, technicien</span>
        </p>
        <p className="kael-text">« {texte} »</p>
      </div>
    </aside>
  );
}

// Quand le compilateur refuse le code : ALERTE, CHEF !
export const ALERTES = [
  'ALERTE, CHEF ! Le compilateur a tout bloqué ! Euh… lis le rapport, moi je tiens la presse.',
  'Ça fume, ça fume ! Le compilateur a laissé un rapport rouge. Je n’y touche pas, c’est toi le spécialiste.',
  'Oh là là… La chaîne s’est arrêtée net. Le rapport dit pourquoi, je crois. Enfin, je l’espère.',
];

// Quand ça compile, mais que Vérifier n'est pas content.
export const DOUTES = [
  'Hmm. Ça tourne… mais ce n’est pas tout à fait ce qu’on m’a commandé. Regarde les critères ?',
  'Presque ! La machine démarre, mais elle ne sort pas la bonne pièce.',
];

const ACCUEIL_KEY = 'oxydeforge.kaelAccueil';

export function accueilDejaVu() {
  try {
    return localStorage.getItem(ACCUEIL_KEY) === '1';
  } catch {
    return false;
  }
}

// Le premier passage à la fonderie : Kael se présente, une seule fois.
export function KaelAccueil({ onClose }: { onClose(): void }) {
  const close = () => {
    try {
      localStorage.setItem(ACCUEIL_KEY, '1');
    } catch {
      // Pas de stockage : Kael se présentera de nouveau, ce n'est pas grave.
    }
    onClose();
  };
  return (
    <div className="kael-welcome" role="dialog" aria-modal="true" aria-labelledby="kael-welcome-title">
      <div className="kael-welcome-card">
        <div className="kael-welcome-head">
          <KaelFace humeur="heureux" />
          <div>
            <h2 id="kael-welcome-title">Kael</h2>
            <p>Technicien de la machinerie</p>
          </div>
        </div>
        <p>« Oh ! Un nouveau, enfin ! Salut, moi c’est Kael. Bienvenue à la fonderie. »</p>
        <p>
          « Ici, on forge des programmes en <strong>Rust</strong>. Chaque exercice remet en marche une machine de l’atelier. Je te
          donnerai les bons de travail… si je ne les perds pas en route. »
        </p>
        <p>
          « Et le <strong>compilateur</strong>, là-bas, il a l’air sévère. Mais c’est le meilleur collègue de l’atelier : il te
          dit toujours ce qui cloche. Bon. On y va ? »
        </p>
        <button className="primary" autoFocus onClick={close}>
          On y va !
        </button>
      </div>
    </div>
  );
}

// La fin de l'intro d'ownership : Kael révèle le reste du chapitre.
// (Message provisoire, à peaufiner.)
export function KaelRevelation({ onClose }: { onClose(): void }) {
  return (
    <div className="kael-welcome" role="dialog" aria-modal="true" aria-labelledby="kael-revelation-title">
      <div className="kael-welcome-card">
        <div className="kael-welcome-head">
          <KaelFace humeur="sourire-en-coin" />
          <div>
            <h2 id="kael-revelation-title">Kael</h2>
            <p>Technicien de la machinerie</p>
          </div>
        </div>
        <p>« Oh ? Déjà fini ? Bravo, apprenti ! »</p>
        <p>
          « Tu viens de boucler la partie <strong>facile</strong>. Celle avec les petites roulettes. »
        </p>
        <p>
          « Maintenant, le vrai boulot : <strong>tout le reste du chapitre</strong> t’attend sur l’établi. Je l’avais caché
          pour ne pas te faire peur. Au travail ! »
        </p>
        <button className="primary" autoFocus onClick={onClose}>
          Au boulot !
        </button>
      </div>
    </div>
  );
}

// Réactions quand un exercice est réussi : une au hasard.
export const BRAVOS = [
  'Ça tourne ! Je savais que tu y arriverais. Enfin, à 80 %.',
  'Parfait, la machine ronronne. Pièce suivante ?',
  'Bravo ! Je vais dire à tout le monde que c’est moi. Non, je rigole.',
  'Et voilà ! Le compilateur ne dit plus rien : c’est sa façon de dire merci.',
  'Magnifique. J’en ai fait tomber ma clé à molette. Sur mon pied.',
  'Impeccable ! Tu veux un café ? Je ne sais plus où est la machine, mais tu le mérites.',
];
