import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Exercice } from '../types';
import { HUMEUR_PAR_DEFAUT, KaelCard } from './Kael';
import { Inline } from './Markdown';

// Démo « La pile et le tas » : où vivent les valeurs, et ce que font copie, déménagement et clone.

interface Case {
  id: string;
  val: string;
  meta: string;
  morte?: boolean;
}

interface Bloc {
  id: string;
  texte: string;
  x: number;
  y: number;
}

interface Etape {
  ligne: number;
  pile: Case[];
  tas: Bloc[];
  fleches: [string, string][];
  titre: string;
  texte: string;
  python?: string;
  fin?: boolean;
}

const CODE: { html: [string, string][] }[] = [
  { html: [['kw', 'fn'], ['', ' main() {']] },
  { html: [['', '    '], ['kw', 'let'], ['', ' a = '], ['nb', '5'], ['', ';']] },
  { html: [['', '    '], ['kw', 'let'], ['', ' b = a;']] },
  { html: [['', '    '], ['kw', 'let'], ['', ' s1 = '], ['ty', 'String'], ['', '::from('], ['st', '"Ferris"'], ['', ');']] },
  { html: [['', '    '], ['kw', 'let'], ['', ' s2 = s1;']] },
  { html: [['', '    '], ['kw', 'let'], ['', ' s3 = s2.clone();']] },
  { html: [['', '}']] },
];

const A: Case = { id: 'a', val: '5', meta: 'i32' };
const B: Case = { id: 'b', val: '5', meta: 'copie' };
const S1: Case = { id: 's1', val: '→', meta: 'adresse · longueur 6' };
const S2: Case = { id: 's2', val: '→', meta: 'adresse · longueur 6' };
const S3: Case = { id: 's3', val: '→', meta: 'adresse · longueur 6' };
const T1: Bloc = { id: 't1', texte: 'Ferris', x: 30, y: 150 };
const T2: Bloc = { id: 't2', texte: 'Ferris', x: 90, y: 40 };

const ETAPES: Etape[] = [
  {
    ligne: 0,
    pile: [],
    tas: [],
    fleches: [],
    titre: 'Deux zones de mémoire',
    texte:
      'Ton programme range ses valeurs à deux endroits. La **pile** : rapide, mais chaque case a une taille connue d’avance. Le **tas** : plus lent, mais on y range ce qui peut grandir, comme le texte d’une `String`.',
  },
  {
    ligne: 1,
    pile: [A],
    tas: [],
    fleches: [],
    titre: 'Un i32 va sur la pile',
    texte: 'Un `i32` fait toujours 4 octets : il se range directement sur la **pile**, en haut de la pile d’assiettes.',
  },
  {
    ligne: 2,
    pile: [A, B],
    tas: [],
    fleches: [],
    titre: 'let b = a : une copie',
    texte: 'Copier 4 octets ne coûte rien : `b` reçoit sa **propre copie** de 5. Les deux variables existent et sont indépendantes.',
  },
  {
    ligne: 3,
    pile: [A, B, S1],
    tas: [T1],
    fleches: [['s1', 't1']],
    titre: 'Une String : un pied dans chaque zone',
    texte:
      'Le **texte** « Ferris » peut grandir : il part dans le **tas**. Sur la pile, `s1` ne garde qu’une petite fiche : **l’adresse** du texte et sa longueur. `s1` est le **propriétaire** de ce texte.',
  },
  {
    ligne: 4,
    pile: [A, B, { ...S1, morte: true }, S2],
    tas: [T1],
    fleches: [['s2', 't1']],
    titre: 'let s2 = s1 : le déménagement',
    texte:
      'Rust ne recopie **pas** le texte : il copie juste la fiche, et `s2` devient le **seul** propriétaire. `s1` est barré : s’en servir donne **E0382**. Pourquoi ? À la fin, chaque propriétaire libère son texte. Avec deux propriétaires, « Ferris » serait libéré **deux fois** : un bug grave en C.',
    python:
      'En Python, `s2 = s1` donne deux noms pour le même objet, et un compteur décide quand le libérer. Rust règle la question à la compilation : un seul propriétaire, toujours.',
  },
  {
    ligne: 5,
    pile: [A, B, { ...S1, morte: true }, S2, S3],
    tas: [T1, T2],
    fleches: [
      ['s2', 't1'],
      ['s3', 't2'],
    ],
    titre: '.clone() : une vraie copie',
    texte:
      '`.clone()` recopie **aussi le texte** dans le tas : deux « Ferris » indépendants, deux propriétaires. C’est pour ça que `clone` coûte plus cher qu’un déménagement : on recopie tout.',
  },
  {
    ligne: 6,
    pile: [A, B, { ...S1, morte: true }, S2, S3],
    tas: [T1, T2],
    fleches: [
      ['s2', 't1'],
      ['s3', 't2'],
    ],
    fin: true,
    titre: 'La fin de la portée : tout est libéré',
    texte:
      'À la `}`, la pile se vide **de haut en bas**. Chaque propriétaire libère son texte : `s3` libère sa copie, `s2` libère « Ferris »… et `s1`, qui a déménagé, ne libère **rien**. Aucune fuite, aucun double nettoyage, sans ramasse-miettes.',
  },
];

// Qui libère quel texte en partant (s1 a déménagé : il ne libère rien).
const LIBERE: Record<string, string> = { s3: 't2', s2: 't1' };

interface Props {
  exercice: Exercice;
  onFinish(): void;
  onNext?: () => void;
}

export function PileTas({ exercice, onFinish, onNext }: Props) {
  const [step, setStep] = useState(0);
  const [partis, setPartis] = useState<string[]>([]);
  const [chemins, setChemins] = useState<string[]>([]);
  const scene = useRef<HTMLDivElement>(null);
  const last = ETAPES.length - 1;
  const etape = ETAPES[step];

  useEffect(() => setStep(0), [exercice.id]);
  useEffect(() => {
    if (step === last) onFinish();
  }, [last, onFinish, step]);

  // Fin de portée : les cases partent une à une, du haut de la pile vers le bas.
  useEffect(() => {
    setPartis([]);
    if (!etape.fin) return;
    const ordre = [...etape.pile].reverse().map((c) => c.id);
    const timers = ordre.map((id, i) => setTimeout(() => setPartis((p) => [...p, id]), 400 + i * 500));
    return () => timers.forEach(clearTimeout);
  }, [etape]);

  // Les flèches de la pile vers le tas, recalculées après chaque rendu.
  const tracer = useCallback(() => {
    const racine = scene.current;
    if (!racine) return;
    const base = racine.getBoundingClientRect();
    const actives = etape.fleches.filter(([de]) => !partis.includes(de));
    setChemins(
      actives.flatMap(([de, vers]) => {
        const a = racine.querySelector(`[data-id="${de}"]`)?.getBoundingClientRect();
        const b = racine.querySelector(`[data-id="${vers}"]`)?.getBoundingClientRect();
        if (!a || !b) return [];
        const x1 = a.right - base.left;
        const y1 = a.top + a.height / 2 - base.top;
        const x2 = b.left - base.left;
        const y2 = b.top + b.height / 2 - base.top;
        return [`M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}`];
      }),
    );
  }, [etape, partis]);

  useLayoutEffect(() => {
    // Les cases arrivent en glissant : on attend la fin de leur petite animation.
    tracer();
    const t = setTimeout(tracer, 380);
    addEventListener('resize', tracer);
    return () => {
      clearTimeout(t);
      removeEventListener('resize', tracer);
    };
  }, [tracer]);

  const go = useCallback((delta: number) => setStep((s) => Math.min(Math.max(s + delta, 0), last)), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step === last) onNext?.();
      else if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, last, onNext, step]);

  return (
    <section className="demo" aria-label="Démonstration">
      <header className="demo-head">
        <p className="eyebrow">Démo · {exercice.notion}</p>
        <h2>{exercice.titre}</h2>
      </header>

      {exercice.kael && step === 0 && (
        <KaelCard type={exercice.type} texte={exercice.kael} humeur={exercice.humeur ?? HUMEUR_PAR_DEFAUT.demo} />
      )}

      <div className="pt-scene" ref={scene}>
        <div className="pt-col">
          <h3>Le code</h3>
          <p className="pt-sub">exécuté ligne par ligne</p>
          <pre className="pt-code">
            {CODE.map((ligne, i) => (
              <div key={i} className={i === etape.ligne ? 'now' : i < etape.ligne ? 'done' : ''}>
                {ligne.html.map(([classe, texte], j) => (
                  <span key={j} className={classe && `pt-${classe}`}>
                    {texte}
                  </span>
                ))}
              </div>
            ))}
          </pre>
        </div>

        <div className="pt-col">
          <h3>La pile (stack)</h3>
          <p className="pt-sub">rapide, taille fixe, rangée comme une pile d’assiettes</p>
          <div className="pt-pile">
            {etape.pile.map((c) => (
              <div
                key={c.id}
                data-id={c.id}
                className={`pt-case${c.morte ? ' morte' : ''}${partis.includes(c.id) ? ' part' : ''}`}
              >
                <span className="pt-nom">{c.id}</span>
                <span className="pt-val">{c.val}</span>
                <span className="pt-meta">{c.meta}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-col">
          <h3>Le tas (heap)</h3>
          <p className="pt-sub">pour ce qui peut grandir : le texte d’une String</p>
          <div className="pt-tas">
            {etape.tas.map((b) => {
              const libere = Object.entries(LIBERE).some(([proprio, bloc]) => bloc === b.id && partis.includes(proprio));
              return (
                <div key={b.id} data-id={b.id} className={`pt-bloc${libere ? ' libere' : ''}`} style={{ left: b.x, top: b.y }}>
                  {[...b.texte].map((lettre, i) => (
                    <span key={i}>{lettre}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <svg className="pt-fleches" aria-hidden>
          <defs>
            <marker id="pt-pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {chemins.map((d) => (
            <path key={d} d={d} markerEnd="url(#pt-pointe)" />
          ))}
        </svg>
      </div>

      <div className="demo-caption" key={`txt-${step}`}>
        <h3>{etape.titre}</h3>
        <p>
          <Inline text={etape.texte} />
        </p>
        {etape.python && (
          <p className="pt-python">
            <strong>En Python : </strong>
            <Inline text={etape.python} />
          </p>
        )}
      </div>

      <nav className="demo-nav">
        <button className="secondary" onClick={() => go(-1)} disabled={step === 0}>
          ← Précédent
        </button>
        <span className="demo-count">
          {step + 1} / {ETAPES.length}
        </span>
        {step === last ? (
          onNext && (
            <button className="primary" onClick={onNext}>
              Exercice suivant →
            </button>
          )
        ) : (
          <button className="primary" onClick={() => go(1)}>
            Suivant →
          </button>
        )}
      </nav>
    </section>
  );
}
