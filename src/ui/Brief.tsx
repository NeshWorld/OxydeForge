import { useEffect, useState } from 'react';
import type { Exercice, Humeur, Module, Verdict } from '../types';
import { HUMEUR_PAR_DEFAUT, KaelCard } from './Kael';

/** Une réaction passagère de Kael (compilation refusée, Vérifier pas content…). */
export interface ReactionKael {
  humeur: Humeur;
  texte: string | null; // null : il garde la réplique du bon de travail
  secousse: number; // change à chaque réaction : Kael sursaute
}
import { highlightRust, Inline, Markdown, RustcOutput } from './Markdown';

const LIBELLE_TYPE: Record<Exercice['type'], string> = {
  lecon: 'Leçon',
  'lis-erreur': "Lis l'erreur",
  introspection: 'Introspection',
  defi: 'Défi',
  demo: 'Démo',
  etape: 'Étape',
};

interface Props {
  exercice: Exercice;
  module: Module;
  verdict: Verdict | null;
  reaction: ReactionKael | null;
  onLoadSolution(): void;
}

export function Brief({ exercice, module, verdict, reaction, onLoadSolution }: Props) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => setRevealed(0), [exercice.id]);
  const total = exercice.indices.length;
  // Avant Vérifier : les critères écrits dans le TOML. Après : le jugement du Rust.
  const criteres: { label: string; ok?: boolean; detail?: string | null }[] =
    verdict?.criteres ?? exercice.criteres.map((label) => ({ label }));

  return (
    <section className="brief" aria-label="Énoncé">
      <header className="brief-head">
        <p className="eyebrow">
          {module.titre} · {exercice.notion} · <span className="type-tag">{LIBELLE_TYPE[exercice.type]}</span>
        </p>
        <h2>{exercice.titre}</h2>
      </header>

      {exercice.kael && (
        <KaelCard
          type={exercice.type}
          texte={reaction?.texte ?? exercice.kael}
          humeur={reaction?.humeur ?? exercice.humeur ?? HUMEUR_PAR_DEFAUT[exercice.type]}
          secousse={reaction?.secousse}
        />
      )}

      <details className="lesson" open>
        <summary>{exercice.type === 'defi' ? 'Rappels' : exercice.type === 'etape' ? 'Ce qu’il te faut' : 'Cours'}</summary>
        <Markdown source={exercice.lecon} />
      </details>

      {exercice.digression && (
        <details className="lesson digression" key={exercice.id}>
          <summary>Digression</summary>
          <Markdown source={exercice.digression} />
        </details>
      )}

      <div className="mission">
        <h3>Mission</h3>
        <Markdown source={exercice.mission} />
      </div>

      {exercice.code_casse && (
        <div className="broken">
          <h3>Le code</h3>
          <pre className="md-code">{highlightRust(exercice.code_casse.trim())}</pre>
        </div>
      )}

      {exercice.erreur && (
        <div className="broken">
          <h3>Ce que répond le compilateur</h3>
          <RustcOutput text={exercice.erreur} />
        </div>
      )}

      {criteres.length > 0 && (
        <div className="criteria">
          <h3>Critères de réussite</h3>
          <ul>
            {criteres.map((c) => (
              <li key={c.label} className={c.ok === undefined ? '' : c.ok ? 'pass' : 'fail'}>
                <span className="criterion-mark" aria-hidden>
                  {c.ok === undefined ? '·' : c.ok ? '✓' : '✗'}
                </span>
                <span>
                  <Inline text={c.label} />
                  {c.detail && <small className="criterion-detail">{c.detail}</small>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="hints">
        <h3>Indices</h3>
        {exercice.indices.slice(0, revealed).map((hint, i) => (
          <p key={i} className="hint">
            <span className="hint-number">{i + 1}</span>
            <span>
              <Inline text={hint} />
            </span>
          </p>
        ))}
        {revealed < total ? (
          <button className="ghost" onClick={() => setRevealed(revealed + 1)}>
            {`Voir l'indice ${revealed + 1}/${total}`}
          </button>
        ) : (
          <button className="ghost" onClick={onLoadSolution}>
            Remplacer mon code par la solution
          </button>
        )}
      </div>
    </section>
  );
}
