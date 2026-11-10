import { useEffect, useRef, useState } from 'react';
import { Circuits } from './Circuits';
import { Gears } from './Gears';
import { Shatter, SHATTER_MS } from './Shatter';

// Friction : un chargement qui a l'air de travailler dur.
// Rythme irrégulier : des segments rapides, des morceaux « lourds » qui traînent
// (les engrenages peinent), et un palier qui bloque à 90 %.
// Les messages imitent la vraie sortie de cargo.
interface Step {
  ms: number;
  verb?: string;
  crate?: string;
  heavy?: boolean;
}

const STEPS: Step[] = [
  { ms: 220, verb: 'Compiling', crate: 'forge-core v0.1.0' },
  { ms: 180 },
  { ms: 750, verb: 'Compiling', crate: 'rouages v0.3.2', heavy: true },
  { ms: 160 },
  { ms: 200, verb: 'Compiling', crate: 'circuits v1.0.0' },
  { ms: 1050, verb: 'Compiling', crate: 'exercices v0.2.0', heavy: true },
  { ms: 230 },
  { ms: 320, verb: 'Linking', crate: 'oxydeforge' },
  { ms: 1350, heavy: true },
  { ms: 300, verb: 'Finished', crate: 'la forge est chaude' },
];

const SEGMENTS = STEPS.length;
const START_DELAY_MS = 300;
const FULL_DELAY_MS = 250;
const FADE_MS = 300;

interface Props {
  ready: boolean;
  onGone(): void;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Les engrenages ralentissent pendant les étapes lourdes, comme s'ils forçaient.
function gearSpeed(rate: number) {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSAnimation && animation.animationName === 'gear-turn') animation.updatePlaybackRate(rate);
  }
}

export function BootScreen({ ready, onGone }: Props) {
  const [index, setIndex] = useState(-1); // étape en cours (-1 : pas encore commencé)
  const [count, setCount] = useState(0); // segments allumés
  const [message, setMessage] = useState<Step | null>(null);
  const [fill, setFill] = useState({ progress: 0, ms: 0 });
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState<null | 'fade' | 'shatter'>(null);
  const [snapshot, setSnapshot] = useState<HTMLElement | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const full = count === SEGMENTS;

  useEffect(() => {
    const timer = setTimeout(() => setIndex(0), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // La dernière étape attend que les exercices soient vraiment chargés.
  const blocked = index === SEGMENTS - 1 && !ready;

  useEffect(() => {
    if (index < 0 || index >= SEGMENTS || blocked) return;
    const step = STEPS[index];
    if (step.verb) setMessage(step);
    gearSpeed(step.heavy ? 0.3 : 1);
    // Les pistes avancent PENDANT l'étape ; le segment s'allume quand elle se termine.
    setFill({ progress: (index + 1) / SEGMENTS, ms: step.ms });
    const timer = setTimeout(() => {
      setCount(index + 1);
      setIndex(index + 1);
    }, step.ms);
    return () => clearTimeout(timer);
  }, [index, blocked]);

  useEffect(() => {
    if (!full) return;
    gearSpeed(1);
    const timer = setTimeout(() => setOpen(true), FULL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [full]);

  useEffect(() => {
    if (open) button.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onGone, leaving === 'shatter' ? SHATTER_MS : FADE_MS);
    return () => clearTimeout(timer);
  }, [leaving, onGone]);

  const enter = () => {
    if (leaving) return;
    if (reducedMotion()) {
      setLeaving('fade');
      return;
    }
    // Copie figée prise AVANT de cacher l'écran : les lamelles montreront exactement ça.
    setSnapshot(overlay.current!.cloneNode(true) as HTMLElement);
    setLeaving('shatter');
  };

  return (
    <>
      <div ref={overlay} className={`boot-overlay${leaving ? ` leaving-${leaving}` : ''}`}>
        <Circuits chip={chip} progress={fill.progress} durationMs={fill.ms} />
        <div ref={chip} className="boot-chip">
          <Gears />
          <p className="boot-status" role="status">
            {message?.verb ? (
              <>
                <span className="boot-verb">{message.verb.padStart(9, ' ')}</span> {message.crate}
              </>
            ) : (
              'Allumage de la forge…'
            )}
          </p>
          <div className="boot-bar-zone">
            <div
              className={`boot-bar${open ? ' full' : ''}`}
              role="progressbar"
              aria-label="Chargement"
              aria-valuemin={0}
              aria-valuemax={SEGMENTS}
              aria-valuenow={count}
            >
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <i key={i} className={i < count ? 'on' : undefined} />
              ))}
            </div>
            {open && (
              <button ref={button} className="boot-enter" onClick={enter}>
                <span>cargo run</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {snapshot && <Shatter source={snapshot} />}
    </>
  );
}
