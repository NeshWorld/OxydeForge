import { useLayoutEffect, useRef } from 'react';

// L'écran de démarrage se découpe en lamelles horizontales (comme un rideau de fer),
// puis les lamelles s'éteignent UNE PAR UNE, du bas vers le haut.
// L'app est déjà affichée dessous.

const ROWS = 14;
const COLUMNS = 1;
const CUT_MS = 260; // la découpe s'ouvre
const ROW_STEP_MS = 85; // une lamelle part toutes les 85 ms
const JITTER_MS = 0;
// Plus court que ROW_STEP_MS : une lamelle a fini de disparaître avant que la suivante commence.
const FADE_MS = 70;

export const SHATTER_MS = CUT_MS + (ROWS - 1) * ROW_STEP_MS + JITTER_MS + FADE_MS;

interface Props {
  // Une copie figée de l'écran de démarrage, découpée en morceaux.
  source: HTMLElement;
}

export function Shatter({ source }: Props) {
  const holder = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = holder.current!;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const tileW = width / COLUMNS;
    const tileH = height / ROWS;

    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const x = column * tileW;
        const y = row * tileH;
        const tile = document.createElement('div');
        tile.className = 'shatter-tile';
        Object.assign(tile.style, {
          left: `${x}px`,
          top: `${y}px`,
          width: `${Math.ceil(tileW)}px`,
          height: `${Math.ceil(tileH)}px`,
          // Rangée du bas d'abord (row = ROWS - 1), puis on remonte.
          animationDuration: `${CUT_MS}ms, ${FADE_MS}ms`,
          animationDelay: `0ms, ${CUT_MS + (ROWS - 1 - row) * ROW_STEP_MS + Math.random() * JITTER_MS}ms`,
        });

        // Chaque morceau montre la bonne portion de l'écran : une copie décalée.
        const copy = source.cloneNode(true) as HTMLElement;
        copy.classList.add('shatter-copy');
        Object.assign(copy.style, { left: `${-x}px`, top: `${-y}px`, width: `${width}px`, height: `${height}px` });
        tile.append(copy);
        root.append(tile);
      }
    }
    return () => root.replaceChildren();
  }, [source]);

  return <div ref={holder} className="shatter" aria-hidden />;
}
