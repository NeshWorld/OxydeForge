// Le train d'engrenages de l'écran de démarrage, dessiné en SVG.
// L'engrenage central est celui de Rust : dents pointues, anneau percé, et un R.

interface Gear {
  r: number; // rayon extérieur
  teeth: number;
  angle: number; // direction depuis l'engrenage précédent, en degrés
  rust?: boolean;
}

const CHAIN: Gear[] = [
  { r: 30, teeth: 10, angle: 0 },
  // Angles choisis pour que chaque engrenage ne touche QUE ses deux voisins de chaîne :
  // deux engrenages qui se touchent doivent tourner en sens inverse.
  { r: 17, teeth: 7, angle: 40 },
  { r: 48, teeth: 32, angle: -20, rust: true },
  { r: 21, teeth: 8, angle: -18 },
  { r: 13, teeth: 6, angle: 32 },
  { r: 30, teeth: 10, angle: 30 },
];

// Chaque engrenage se place contre le précédent, dents légèrement imbriquées.
const PLACED = CHAIN.reduce<(Gear & { x: number; y: number })[]>((acc, gear, i) => {
  if (i === 0) return [{ ...gear, x: gear.r + 6, y: 92 }];
  const prev = acc[i - 1];
  const distance = prev.r + gear.r - 5;
  const a = (gear.angle * Math.PI) / 180;
  return [...acc, { ...gear, x: prev.x + Math.cos(a) * distance, y: prev.y + Math.sin(a) * distance }];
}, []);

const WIDTH = Math.max(...PLACED.map((g) => g.x + g.r)) + 6;
const HEIGHT = Math.max(...PLACED.map((g) => g.y + g.r)) + 6;
const TOP = Math.min(...PLACED.map((g) => g.y - g.r)) - 6;

function point(radius: number, angle: number) {
  return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
}

// Le contour d'un engrenage : une dent trapèze (ou pointue) par pas, reliées par le fond.
function outline(teeth: number, outer: number, inner: number, sharp: boolean) {
  const step = (Math.PI * 2) / teeth;
  const base = step * 0.3;
  const tip = sharp ? step * 0.04 : step * 0.17;
  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    points.push(point(inner, a - base), point(outer, a - tip), point(outer, a + tip), point(inner, a + base));
  }
  return `M${points.join('L')}Z`;
}

function circle(radius: number) {
  return `M${radius},0A${radius},${radius} 0 1,0 ${-radius},0A${radius},${radius} 0 1,0 ${radius},0Z`;
}

function GearShape({ gear }: { gear: Gear }) {
  if (gear.rust) {
    const ring = gear.r * 0.84;
    const hole = gear.r * 0.64;
    return (
      <>
        <path className="gear-rust" fillRule="evenodd" d={outline(gear.teeth, gear.r, ring, true) + circle(hole)} />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
          const mid = (ring + hole) / 2;
          return <circle key={i} className="gear-hole" cx={Math.cos(a) * mid} cy={Math.sin(a) * mid} r={gear.r * 0.055} />;
        })}
        <text className="gear-rust-r" textAnchor="middle" dominantBaseline="central" fontSize={gear.r * 0.95}>
          R
        </text>
      </>
    );
  }
  return (
    <path className="gear" fillRule="evenodd" d={outline(gear.teeth, gear.r, gear.r * 0.78, false) + circle(gear.r * 0.42)} />
  );
}

export function Gears() {
  return (
    <svg className="gears" viewBox={`0 ${TOP} ${WIDTH} ${HEIGHT - TOP}`} aria-hidden>
      {PLACED.map((gear, i) => (
        <g key={i} transform={`translate(${gear.x.toFixed(2)} ${gear.y.toFixed(2)})`}>
          {/* Deux engrenages qui se touchent tournent en sens inverse ; le petit tourne plus vite. */}
          <g
            className="gear-spin"
            style={{
              animationDuration: `${(gear.r / 30) * 4}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }}
          >
            <GearShape gear={gear} />
          </g>
        </g>
      ))}
    </svg>
  );
}
