import { useEffect, useRef, useState, type RefObject } from 'react';

// Le circuit imprimé de l'écran de démarrage.
//
// Vocabulaire :
//   puce     → la zone centrale (engrenages + barre), invisible
//   broche   → petite patte au bord de la puce, d'où part une piste
//   piste    → le « fil » de cuivre, gris puis orange
//   via      → petit trou métallisé sur une piste
//   pastille → le rond de soudure au bout d'une piste
//
// Les pistes se remplissent du centre vers les bords, au rythme du chargement.

interface Trace {
  d: string;
  pin: { x: number; y: number; w: number; h: number } | null;
  pad: [number, number] | null;
  vias: [number, number][];
}

// Le décor : des composants qui ne s'allument jamais, reliés par des pistes mortes.
// Quelques voyants clignotent de temps en temps, comme une machine en veille.
type Part =
  | { kind: 'resistance'; x: number; y: number; vertical: boolean }
  | { kind: 'condensateur'; x: number; y: number }
  | { kind: 'puce'; x: number; y: number; vertical: boolean };

interface Led {
  x: number;
  y: number;
  color: 'info' | 'warn' | 'success' | 'danger';
  periodS: number;
  delayS: number;
}

interface Board {
  width: number;
  height: number;
  traces: Trace[];
  freePins: { x: number; y: number; w: number; h: number }[];
  center: [number, number];
  parts: Part[];
  deadTraces: string[];
  leds: Led[];
}

const GRID = 12; // les pistes suivent une grille, comme un vrai circuit imprimé
const PIN_LONG = 12;
const PIN_WIDE = 5;

// Hasard « à graine » : les mêmes pistes à chaque démarrage.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function design(chip: DOMRect, width: number, height: number): Board {
  const rand = seeded(7);
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  const cx = chip.left + chip.width / 2;
  const cy = chip.top + chip.height / 2;

  const starts: { x: number; y: number; dx: number; dy: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const x = chip.left + ((i + 0.5) / 14) * chip.width;
    starts.push({ x, y: chip.top, dx: 0, dy: -1 }, { x, y: chip.bottom, dx: 0, dy: 1 });
  }
  for (let i = 0; i < 7; i++) {
    const y = chip.top + ((i + 0.5) / 7) * chip.height;
    starts.push({ x: chip.left, y, dx: -1, dy: 0 }, { x: chip.right, y, dx: 1, dy: 0 });
  }

  const traces: Trace[] = [];
  const segments: [number, number, number, number][] = [];
  const freePins: Board['freePins'] = [];
  for (const s of starts) {
    const vertical = s.dx === 0;
    const pin = {
      x: vertical ? s.x - PIN_WIDE / 2 : s.dx > 0 ? s.x : s.x - PIN_LONG,
      y: vertical ? (s.dy > 0 ? s.y : s.y - PIN_LONG) : s.y - PIN_WIDE / 2,
      w: vertical ? PIN_WIDE : PIN_LONG,
      h: vertical ? PIN_LONG : PIN_WIDE,
    };
    // Quelques broches restent libres, comme sur une vraie puce.
    if (rand() < 0.15) {
      freePins.push(pin);
      continue;
    }

    let x = s.x + s.dx * PIN_LONG;
    let y = s.y + s.dy * PIN_LONG;
    let dx = s.dx;
    let dy = s.dy;
    // La piste s'écarte en éventail, du côté où elle se trouve.
    const sideX = Math.sign(x - cx) || 1;
    const sideY = Math.sign(y - cy) || 1;
    const straight: [number, number] = vertical ? [0, s.dy] : [s.dx, 0];
    const points: [number, number][] = [[x, y]];
    const vias: [number, number][] = [];
    let first = true;
    while (x > -20 && x < width + 20 && y > -20 && y < height + 20) {
      const len = first ? 18 + rand() * 30 : snap(30 + rand() * 120);
      first = false;
      x += dx * len;
      y += dy * len;
      points.push([x, y]);
      if (rand() < 0.25) vias.push([x, y]);
      // Virage : diagonale à 45° vers l'extérieur, ou retour tout droit.
      if (dx === straight[0] && dy === straight[1]) {
        if (rand() < 0.6) {
          if (vertical) [dx, dy] = [sideX * Math.SQRT1_2, s.dy * Math.SQRT1_2];
          else [dx, dy] = [s.dx * Math.SQRT1_2, sideY * Math.SQRT1_2];
        }
      } else {
        [dx, dy] = straight;
      }
    }
    for (let k = 1; k < points.length; k++) segments.push([...points[k - 1], ...points[k]]);
    traces.push({
      d: 'M' + points.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L'),
      pin,
      pad: points[points.length - 2] ?? null,
      vias,
    });
  }
  return { width, height, traces, freePins, center: [cx, cy], ...decor(chip, width, height, segments) };
}

// Distance d'un point à un segment [x1, y1, x2, y2].
function distance(px: number, py: number, [x1, y1, x2, y2]: [number, number, number, number]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}

const LED_COLORS: Led['color'][] = ['info', 'warn', 'success', 'danger'];

// Pose le décor dans les trous laissés par les vraies pistes, loin de la puce.
function decor(chip: DOMRect, width: number, height: number, segments: [number, number, number, number][]) {
  const rand = seeded(13); // autre graine : les pistes orange ne bougent pas
  const parts: Part[] = [];
  const deadTraces: string[] = [];
  const leds: Led[] = [];
  const taken: [number, number, number][] = []; // x, y, rayon
  const free = (x: number, y: number, r: number) =>
    x > r && x < width - r && y > r && y < height - r &&
    !(x > chip.left - 40 - r && x < chip.right + 40 + r && y > chip.top - 40 - r && y < chip.bottom + 40 + r) &&
    segments.every((seg) => distance(x, y, seg) > r + 8) &&
    taken.every(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) > r + tr + 6);

  const tries = Math.round((width * height) / 1800);
  for (let i = 0; i < tries; i++) {
    const x = Math.round((rand() * width) / GRID) * GRID;
    const y = Math.round((rand() * height) / GRID) * GRID;
    const roll = rand();
    const vertical = rand() < 0.5;
    const part: Part =
      roll < 0.5 ? { kind: 'resistance', x, y, vertical } : roll < 0.8 ? { kind: 'condensateur', x, y } : { kind: 'puce', x, y, vertical };
    const r = part.kind === 'puce' ? 26 : part.kind === 'resistance' ? 20 : 12;
    if (!free(x, y, r)) continue;
    taken.push([x, y, r]);
    parts.push(part);

    // Une piste morte part du composant, dans le sens où il est posé.
    const stub = Math.round((24 + rand() * 60) / GRID) * GRID;
    const out = r - 4;
    const [sx, sy, ex, ey] =
      part.kind !== 'condensateur' && part.vertical ? [x, y + out, x, y + out + stub] : [x + out, y, x + out + stub, y];
    if (segments.every((seg) => distance(ex, ey, seg) > 10)) {
      deadTraces.push(`M${sx},${sy}L${ex},${ey}`);
      segments.push([sx, sy, ex, ey]);
    }

    // Un composant sur six a son voyant.
    if (rand() < 0.17) {
      const lx = x - r - 6;
      const ly = y - r + 4;
      leds.push({
        x: lx,
        y: ly,
        color: LED_COLORS[Math.floor(rand() * LED_COLORS.length)],
        periodS: 6 + rand() * 9,
        delayS: rand() * 10,
      });
    }
  }
  return { parts, deadTraces, leds };
}

interface Props {
  chip: RefObject<HTMLElement | null>;
  /** De 0 (gris) à 1 (tout orange). */
  progress: number;
  /** Durée pour atteindre `progress`, en millisecondes. */
  durationMs: number;
}

export function Circuits({ chip, progress, durationMs }: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  // Le circuit se dessine autour de la puce, et se redessine si la fenêtre change de taille.
  // useEffect (et pas useLayoutEffect) : la puce est rendue APRÈS le circuit, sa référence
  // n'existe qu'une fois tout l'écran posé.
  useEffect(() => {
    const draw = () => chip.current && setBoard(design(chip.current.getBoundingClientRect(), innerWidth, innerHeight));
    draw();
    addEventListener('resize', draw);
    return () => removeEventListener('resize', draw);
  }, [chip]);

  // Remplissage : chaque piste allumée est un long tiret qu'on fait glisser.
  useEffect(() => {
    const root = svg.current;
    if (!root || !board) return;
    root.querySelectorAll<SVGPathElement>('.trace.on').forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.transition = durationMs ? `stroke-dashoffset ${durationMs}ms ease-out` : 'none';
      path.style.strokeDashoffset = String(length * (1 - progress));
    });
    const [cx, cy] = board.center;
    const farthest = Math.hypot(Math.max(cx, board.width - cx), Math.max(cy, board.height - cy));
    root.querySelectorAll<SVGCircleElement>('.via').forEach((via) => {
      const distance = Math.hypot(+via.getAttribute('cx')! - cx, +via.getAttribute('cy')! - cy);
      via.classList.toggle('lit', distance / farthest < progress * 0.95);
    });
  }, [board, durationMs, progress]);

  if (!board) return <svg ref={svg} className="circuits" aria-hidden />;

  return (
    <svg ref={svg} className="circuits" viewBox={`0 0 ${board.width} ${board.height}`} aria-hidden>
      <g className="decor">
        {board.deadTraces.map((d, i) => (
          <path key={`dead-${i}`} className="dead-trace" d={d} />
        ))}
        {board.parts.map((p, i) =>
          p.kind === 'condensateur' ? (
            <circle key={`part-${i}`} className="part" cx={p.x} cy={p.y} r={8} />
          ) : p.kind === 'resistance' ? (
            <rect
              key={`part-${i}`}
              className="part"
              x={p.vertical ? p.x - 5 : p.x - 14}
              y={p.vertical ? p.y - 14 : p.y - 5}
              width={p.vertical ? 10 : 28}
              height={p.vertical ? 28 : 10}
              rx={3}
            />
          ) : (
            <g key={`part-${i}`}>
              {[-12, -4, 4, 12].flatMap((o) =>
                [-1, 1].map((side) => (
                  <rect
                    key={`${o}-${side}`}
                    className="part-leg"
                    x={p.vertical ? p.x + side * 15 - 3 : p.x + o - 1.5}
                    y={p.vertical ? p.y + o - 1.5 : p.y + side * 15 - 3}
                    width={p.vertical ? 6 : 3}
                    height={p.vertical ? 3 : 6}
                  />
                )),
              )}
              <rect
                className="part"
                x={p.vertical ? p.x - 12 : p.x - 20}
                y={p.vertical ? p.y - 20 : p.y - 12}
                width={p.vertical ? 24 : 40}
                height={p.vertical ? 40 : 24}
                rx={2}
              />
            </g>
          ),
        )}
        {board.leds.map((l, i) => (
          <circle
            key={`led-${i}`}
            className={`led led-${l.color}`}
            cx={l.x}
            cy={l.y}
            r={3}
            style={{ animationDuration: `${l.periodS.toFixed(1)}s`, animationDelay: `${l.delayS.toFixed(1)}s` }}
          />
        ))}
      </g>
      {board.freePins.map((p, i) => (
        <rect key={`free-${i}`} className="pin" x={p.x} y={p.y} width={p.w} height={p.h} rx={1} />
      ))}
      {board.traces.map((t, i) => (
        <g key={i}>
          <path className="trace off" d={t.d} />
          <path className="trace on" d={t.d} />
          {t.vias.map(([x, y], j) => (
            <circle key={j} className="via" cx={x} cy={y} r={3} />
          ))}
          {t.pin && (
            <rect className={`pin${progress > 0 ? ' lit' : ''}`} x={t.pin.x} y={t.pin.y} width={t.pin.w} height={t.pin.h} rx={1} />
          )}
          {t.pad && <circle className={`pad${progress >= 0.999 ? ' lit' : ''}`} cx={t.pad[0]} cy={t.pad[1]} r={4.5} />}
        </g>
      ))}
    </svg>
  );
}
