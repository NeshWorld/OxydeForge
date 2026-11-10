import { useCallback, useEffect, useMemo, useState } from 'react';
import { DANS_TAURI, executer } from '../api';
import type { Execution, Exercice } from '../types';
import { HUMEUR_PAR_DEFAUT, KaelCard } from './Kael';
import { highlightRust, Inline } from './Markdown';

// « Dans la machine » : ce que fait rustc entre main.rs et main.exe, étape par étape.

interface Step {
  station: string;
  titre: string;
  texte: string;
  // Affiche l'encadré « Compilé ou interprété ? » sous l'explication.
  laius?: boolean;
}

// Le petit laïus de l'étape Exécution : compilé (Rust) contre interprété (Python).
const COMPARAISON: [string, string, string][] = [
  ['La traduction', 'une seule fois, **avant** de lancer', 'à **chaque** lancement, au fil de la lecture'],
  ['Ce que tu lances', '`main.exe`, tout seul', '`python main.py` : l’interpréteur **et** ton code'],
  ['Les erreurs', 'trouvées **avant** : rustc refuse de compiler', 'trouvées **pendant** : le programme plante en route'],
  ['La vitesse', 'très rapide : c’est déjà du code machine', 'plus lente : on traduit en même temps qu’on exécute'],
  ['Pour partager', 'le `.exe` suffit (pour un système donné)', 'il faut Python installé chez l’autre'],
];

function Laius() {
  return (
    <div className="demo-laius">
      <h4>Compilé ou interprété ?</h4>
      <p>
        Imagine un livre en anglais. <strong>Compiler</strong>, c’est le faire traduire <strong>une fois</strong>, puis imprimer la
        version française. <strong>Interpréter</strong>, c’est lire avec un interprète à côté de soi, qui traduit{' '}
        <strong>phrase par phrase</strong>, à chaque lecture.
      </p>
      <div className="md-table">
        <table>
          <thead>
            <tr>
              <th />
              <th>Compilé : Rust, C</th>
              <th>Interprété : Python, JavaScript</th>
            </tr>
          </thead>
          <tbody>
            {COMPARAISON.map(([sujet, compile, interprete]) => (
              <tr key={sujet}>
                <th>{sujet}</th>
                <td>
                  <Inline text={compile} />
                </td>
                <td>
                  <Inline text={interprete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="demo-nuance">
        Nuance : Python « pré-traduit » en coulisses (les fichiers <code>.pyc</code>), mais il a toujours besoin de
        l’interpréteur pour tourner. Et un langage peut avoir les deux : c’est un choix d’outil, pas une loi.
      </p>
    </div>
  );
}

const STEPS: Step[] = [
  {
    station: 'main.rs',
    titre: 'Ton code',
    texte: "Tout commence par un fichier texte : main.rs. Pour l'ordinateur, ce n'est encore qu'une suite de caractères, sans aucun sens.",
  },
  {
    station: '1 · Découpe',
    titre: 'rustc découpe le texte',
    texte: 'rustc lit les caractères un par un et les regroupe en morceaux qui ont un sens : les jetons (tokens). Les espaces et les retours à la ligne disparaissent.',
  },
  {
    station: '2 · Structure',
    titre: 'rustc range les jetons en arbre',
    texte: 'Les jetons sont organisés comme une phrase : une fonction main, qui contient un bloc, qui contient un appel de macro, avec un texte en argument.',
  },
  {
    station: '3 · Vérification',
    titre: 'rustc vérifie TOUT',
    texte: "L'étape qui fait la réputation de Rust. Les deux codes passent les mêmes contrôles. À droite, une seule règle est violée, et tout s'arrête ici : pas de main.exe. C'est là que naissent les E0384, E0382 et compagnie.",
  },
  {
    station: '4 · Code machine',
    titre: 'rustc traduit pour le processeur',
    texte: "L'arbre vérifié est traduit en instructions pour ton processeur : des 0 et des 1. Le résultat est un fichier à part entière : main.exe.",
  },
  {
    station: '5 · Exécution',
    titre: 'Le processeur exécute main.exe',
    texte: "rustc a fini. C'est maintenant ton processeur qui lance main.exe, directement : ni Rust ni rustc ne sont plus nécessaires.",
    laius: true,
  },
  {
    station: 'Pour de vrai',
    titre: 'À toi de lancer la machine',
    texte: 'Tout ce que tu viens de voir se passe en vrai, en une fraction de seconde. Lance-le et regarde le temps mesuré.',
  },
];

const TOKENS: { texte: string; sorte: string; classe: string }[] = [
  { texte: 'fn', sorte: 'mot-clé', classe: 'tok-keyword' },
  { texte: 'main', sorte: 'nom', classe: '' },
  { texte: '(', sorte: 'symbole', classe: 'tok-punct' },
  { texte: ')', sorte: 'symbole', classe: 'tok-punct' },
  { texte: '{', sorte: 'symbole', classe: 'tok-punct' },
  { texte: 'println!', sorte: 'macro', classe: 'tok-macro' },
  { texte: '(', sorte: 'symbole', classe: 'tok-punct' },
  { texte: '"Hello, world!"', sorte: 'texte', classe: 'tok-string' },
  { texte: ')', sorte: 'symbole', classe: 'tok-punct' },
  { texte: ';', sorte: 'symbole', classe: 'tok-punct' },
  { texte: '}', sorte: 'symbole', classe: 'tok-punct' },
];

const ARBRE = [
  { niveau: 0, code: 'fn main()', role: 'une fonction' },
  { niveau: 1, code: '{ … }', role: 'son bloc' },
  { niveau: 2, code: 'println!( … )', role: 'un appel de macro' },
  { niveau: 3, code: '"Hello, world!"', role: 'son argument : un texte' },
];

// Les mêmes contrôles, sur deux codes : l'un passe, l'autre se fait arrêter.
interface Check {
  titre: string;
  ok: boolean;
  detail: string;
}

const CODE_INVALIDE = `fn main() {
    let x = 5;
    x = 6;
    println!("{x}");
}`;

const CHECKS_VALIDE: Check[] = [
  { titre: 'Chaque nom existe', ok: true, detail: 'main, println! : rien d’inconnu' },
  { titre: 'Les types collent', ok: true, detail: 'println! reçoit bien un texte' },
  { titre: 'Les propriétaires sont respectés', ok: true, detail: 'aucune valeur utilisée après déménagement' },
  { titre: 'Rien ne change en douce', ok: true, detail: 'aucune variable immuable modifiée' },
];

const CHECKS_INVALIDE: Check[] = [
  { titre: 'Chaque nom existe', ok: true, detail: 'main, x, println! : tous connus' },
  { titre: 'Les types collent', ok: true, detail: 'x est un entier, 6 aussi' },
  { titre: 'Les propriétaires sont respectés', ok: true, detail: 'x n’a pas déménagé' },
  { titre: 'Rien ne change en douce', ok: false, detail: 'x = 6 alors que x est immuable → E0384' },
];

const CHECK_DELAI = 0.45;

function Verification({ nom, code, checks, decalage }: { nom: string; code: string; checks: Check[]; decalage: number }) {
  const valide = checks.every((c) => c.ok);
  return (
    <div className={`demo-verif ${valide ? 'ok' : 'ko'}`}>
      <p className="demo-file-name">{nom}</p>
      <pre className="md-code">{highlightRust(code)}</pre>
      <ul>
        {checks.map((c, i) => (
          <li key={c.titre} className={c.ok ? '' : 'fail'} style={{ animationDelay: `${decalage + i * CHECK_DELAI}s` }}>
            <span className="demo-check-mark">{c.ok ? '✓' : '✗'}</span>
            <span>
              <strong>{c.titre}</strong>
              <small>{c.detail}</small>
            </span>
          </li>
        ))}
      </ul>
      <span className="demo-stamp" style={{ animationDelay: `${decalage + checks.length * CHECK_DELAI + 0.2}s` }}>
        {valide ? 'Validé' : 'Refusé'}
      </span>
    </div>
  );
}

function Stage({ step, code }: { step: number; code: string }) {
  // Des lignes de 0 et de 1, tirées une fois pour toutes.
  const binaire = useMemo(
    () => Array.from({ length: 9 }, () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(2).padStart(8, '0')).join(' ')),
    [],
  );

  switch (step) {
    case 0:
      return (
        <div className="demo-file">
          <p className="demo-file-name">main.rs</p>
          <pre className="md-code">{highlightRust(code)}</pre>
        </div>
      );
    case 1:
      return (
        <div className="demo-tokens">
          {TOKENS.map((t, i) => (
            <span key={i} className="demo-token" style={{ animationDelay: `${i * 0.12}s` }}>
              <code className={t.classe}>{t.texte}</code>
              <small>{t.sorte}</small>
            </span>
          ))}
        </div>
      );
    case 2:
      return (
        <ul className="demo-tree">
          {ARBRE.map((n, i) => (
            <li key={i} style={{ marginLeft: `${n.niveau * 34}px`, animationDelay: `${i * 0.35}s` }}>
              {n.niveau > 0 && <span className="demo-branch">└─</span>}
              <code>{n.code}</code>
              <small>{n.role}</small>
            </li>
          ))}
        </ul>
      );
    case 3:
      return (
        <div className="demo-split">
          <Verification nom="main.rs : accepté" code={code} checks={CHECKS_VALIDE} decalage={0} />
          {/* Le second code est vérifié juste après le premier. */}
          <Verification
            nom="main.rs : refusé"
            code={CODE_INVALIDE}
            checks={CHECKS_INVALIDE}
            decalage={CHECKS_VALIDE.length * CHECK_DELAI + 0.6}
          />
        </div>
      );
    case 4:
      return (
        <div className="demo-machine">
          <pre className="demo-binary">
            {binaire.map((ligne, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.13}s` }}>
                {ligne}
                {'\n'}
              </span>
            ))}
          </pre>
          <div className="demo-exe" style={{ animationDelay: `${binaire.length * 0.13 + 0.15}s` }}>
            <span className="demo-exe-icon">{'{ }'}</span>
            <strong>main.exe</strong>
            <small>prêt à être lancé</small>
          </div>
        </div>
      );
    case 5:
      return (
        <div className="demo-terminal">
          <p className="demo-terminal-bar">Terminal</p>
          <pre>
            <span className="demo-typed">$ ./main.exe</span>
            {'\n'}
            <span className="demo-output">Hello, world!</span>
          </pre>
        </div>
      );
    default:
      return null;
  }
}

function Reel({ code }: { code: string }) {
  const [busy, setBusy] = useState(false);
  const [resultat, setResultat] = useState<Execution | null>(null);
  const [probleme, setProbleme] = useState<string | null>(null);

  const lancer = async () => {
    setBusy(true);
    setProbleme(null);
    try {
      setResultat(await executer(code));
    } catch (e) {
      setProbleme(String(e));
    }
    setBusy(false);
  };

  return (
    <div className="demo-real">
      <div className="demo-file">
        <p className="demo-file-name">main.rs</p>
        <pre className="md-code">{highlightRust(code)}</pre>
      </div>
      <button className="primary" onClick={lancer} disabled={busy || !DANS_TAURI}>
        {busy ? 'La machine tourne…' : '$ cargo run'}
      </button>
      {!DANS_TAURI && <p className="empty problem">La vraie compilation ne marche que dans la fenêtre OxydeForge.</p>}
      {probleme && <p className="empty problem">{probleme}</p>}
      {resultat && (
        <div className="demo-terminal">
          <p className="demo-terminal-bar">Terminal</p>
          <pre>
            <span className="demo-output">{resultat.sortie || resultat.compilateur}</span>
          </pre>
          <p className="timing">
            ⏱ Étapes 1 à 4 (compilation) : {resultat.duree_compilation_ms} ms · Étape 5 (exécution) : {resultat.duree_execution_ms} ms
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  exercice: Exercice;
  onFinish(): void;
  /** Passe à l'exercice suivant (absent s'il n'y en a pas). */
  onNext?: () => void;
}

export function Demo({ exercice, onFinish, onNext }: Props) {
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;
  const code = exercice.solution.trim();

  useEffect(() => setStep(0), [exercice.id]);
  useEffect(() => {
    if (step === last) onFinish();
  }, [last, onFinish, step]);

  const go = useCallback((delta: number) => setStep((s) => Math.min(Math.max(s + delta, 0), last)), [last]);

  // Flèches du clavier : ← précédent, → suivant.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step === last) onNext?.();
      else if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, last, onNext, step]);

  const current = STEPS[step];

  return (
    <section className="demo" aria-label="Démonstration">
      <header className="demo-head">
        <p className="eyebrow">Démo · {exercice.notion}</p>
        <h2>{exercice.titre}</h2>
      </header>

      {exercice.kael && step === 0 && (
        <KaelCard type={exercice.type} texte={exercice.kael} humeur={exercice.humeur ?? HUMEUR_PAR_DEFAUT.demo} />
      )}

      <ol className="demo-pipeline">
        {STEPS.map((s, i) => (
          <li key={s.station} className={i === step ? 'current' : i < step ? 'passed' : ''}>
            <button onClick={() => setStep(i)}>{s.station}</button>
          </li>
        ))}
      </ol>

      {/* key : changer d'étape remonte la scène, ce qui relance ses animations. */}
      <div className="demo-stage" key={step}>
        {step === last ? <Reel code={code} /> : <Stage step={step} code={code} />}
      </div>

      <div className="demo-caption" key={`txt-${step}`}>
        <h3>{current.titre}</h3>
        <p>{current.texte}</p>
        {current.laius && <Laius />}
      </div>

      <nav className="demo-nav">
        <button className="secondary" onClick={() => go(-1)} disabled={step === 0}>
          ← Précédent
        </button>
        <span className="demo-count">
          {step + 1} / {STEPS.length}
        </span>
        {/* À la dernière étape, Suivant mène à l'exercice d'après. */}
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
