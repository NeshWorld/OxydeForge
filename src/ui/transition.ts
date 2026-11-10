// Le passage à l'exercice suivant, une fois le précédent réussi.
//
//   Exercice  : l'ancien texte s'efface mot par mot, du haut vers le bas, et le nouveau
//               s'écrit juste derrière la « gomme », mot par mot (vitesse FIXE par mot).
//   Code      : l'AFFICHAGE du code s'efface (chaque ligne depuis sa fin), dans exactement
//               le même temps que le texte. Le brouillon enregistré n'est pas touché.
//   Résultats : simple fondu.
//
// Tout se joue sur des COPIES posées par-dessus l'interface : React n'est jamais dérangé.

const OUT_MS = 10; // délai entre deux mots qui s'effacent
const IN_MS = 10; // délai entre deux mots qui s'écrivent
const FADE_MS = 160; // fondu d'un mot
const OUTPUT_FADE_MS = 400;

// Les blocs avec un fond ou un cadre : ils partent avec leur dernier mot et arrivent avec le premier.
const FRAMES = '.kael-card, .mission, .md-code, .rustc, .hint, .md-table, .broken, summary';

export interface Snapshot {
  brief: HTMLElement;
  scroll: number;
  code: string;
  output: HTMLElement | null;
}

/** Photographie l'exercice affiché, AVANT de passer au suivant. */
export function capture(code: string): Snapshot | null {
  const brief = document.querySelector<HTMLElement>('.brief');
  if (!brief || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const output = document.querySelector<HTMLElement>('.output-body');
  return {
    brief: brief.cloneNode(true) as HTMLElement,
    scroll: brief.scrollTop,
    code,
    output: output ? (output.cloneNode(true) as HTMLElement) : null,
  };
}

// Chaque mot devient un <span class="swap-w">. Un bout de code inline reste un seul « mot ».
function wrapWords(root: HTMLElement): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (!node.textContent?.trim() || node.parentElement?.closest('code')) continue;
    const fragment = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
      } else {
        const span = document.createElement('span');
        span.className = 'swap-w';
        span.textContent = part;
        fragment.append(span);
      }
    }
    node.replaceWith(fragment);
  }
  root.querySelectorAll('code').forEach((c) => c.classList.add('swap-w'));
  return [...root.querySelectorAll<HTMLElement>('.swap-w')];
}

function frames(root: HTMLElement, words: HTMLElement[]) {
  return [...root.querySelectorAll<HTMLElement>(FRAMES)]
    .map((box) => {
      const inside = words.filter((w) => box.contains(w));
      return { box, first: words.indexOf(inside[0]), last: words.indexOf(inside[inside.length - 1]) };
    })
    .filter((f) => f.first >= 0);
}

function place(el: HTMLElement, over: Element) {
  const r = over.getBoundingClientRect();
  Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
}

// L'affichage du code s'efface : chaque ligne raccourcit depuis sa fin, toutes ensemble.
function eraseCode(layer: HTMLElement, code: string, duration: number) {
  const lines = code.replace(/\n+$/, '').split('\n');
  const pre = document.createElement('pre');
  layer.append(pre);
  const start = performance.now();
  return new Promise<void>((done) => {
    const frame = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      pre.innerHTML = '';
      lines.forEach((line, i) => {
        const row = document.createElement('div');
        const num = document.createElement('span');
        num.className = 'swap-num';
        num.textContent = String(i + 1);
        row.append(num, line.slice(0, Math.round(line.length * (1 - t))));
        pre.append(row);
      });
      if (t < 1) requestAnimationFrame(frame);
      else done();
    };
    requestAnimationFrame(frame);
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Joue la transition, une fois le NOUVEL exercice affiché (en dessous). */
export async function play(snapshot: Snapshot) {
  const realBrief = document.querySelector<HTMLElement>('.brief');
  const pane = document.querySelector<HTMLElement>('.editor-pane');
  const realOutput = document.querySelector<HTMLElement>('.output-body');
  if (!realBrief) return;

  // 1. L'énoncé : l'ancien et le nouveau, empilés au même endroit.
  const stage = document.createElement('div');
  stage.className = 'swap-stage';
  place(stage, realBrief);
  const oldLayer = snapshot.brief;
  const newLayer = realBrief.cloneNode(true) as HTMLElement;
  oldLayer.classList.add('swap-layer');
  newLayer.classList.add('swap-layer');
  stage.append(oldLayer, newLayer);
  document.body.append(stage);
  oldLayer.scrollTop = snapshot.scroll;
  realBrief.style.visibility = 'hidden';

  const oldWords = wrapWords(oldLayer);
  const newWords = wrapWords(newLayer);
  const outDuration = oldWords.length * OUT_MS + FADE_MS;
  const goneAt = (i: number) => i * OUT_MS + FADE_MS;

  oldWords.forEach((w, i) => setTimeout(() => w.classList.add('out'), i * OUT_MS));
  frames(oldLayer, oldWords).forEach(({ box, last }) => setTimeout(() => box.classList.add('swap-gone'), last * OUT_MS));

  // Chaque nouveau mot attend que sa ligne soit libre : jamais deux textes l'un sur l'autre.
  const oldTops = oldWords.map((w) => w.getBoundingClientRect().top);
  const free = (y: number) => {
    let last = -1;
    oldTops.forEach((t, j) => {
      if (t <= y + 4) last = j;
    });
    return last < 0 ? 0 : goneAt(last);
  };
  const appearAt = newWords.map((w, i) => Math.max(i * IN_MS, free(w.getBoundingClientRect().top)));
  newWords.forEach((w, i) => {
    w.classList.add('hidden');
    setTimeout(() => w.classList.remove('hidden'), appearAt[i]);
  });
  frames(newLayer, newWords).forEach(({ box, first }) => {
    box.classList.add('swap-gone');
    setTimeout(() => box.classList.remove('swap-gone'), appearAt[first]);
  });
  const inDuration = (appearAt.length ? Math.max(...appearAt) : 0) + FADE_MS;

  // 2. Le code : une copie de l'affichage qui s'efface par-dessus l'éditeur (déjà vidé dessous).
  const extras: HTMLElement[] = [];
  let erasing: Promise<void> = Promise.resolve();
  if (pane && snapshot.code.trim()) {
    const codeLayer = document.createElement('div');
    codeLayer.className = 'swap-code';
    place(codeLayer, pane);
    document.body.append(codeLayer);
    extras.push(codeLayer);
    erasing = eraseCode(codeLayer, snapshot.code, outDuration);
  }

  // 3. Les résultats : l'ancien contenu part en fondu par-dessus le nouveau.
  if (realOutput && snapshot.output) {
    const out = snapshot.output;
    out.classList.add('swap-output');
    place(out, realOutput);
    document.body.append(out);
    extras.push(out);
    requestAnimationFrame(() => requestAnimationFrame(() => out.classList.add('swap-gone')));
    setTimeout(() => out.remove(), OUTPUT_FADE_MS + 50);
  }

  await Promise.all([wait(Math.max(outDuration, inDuration)), erasing]);
  stage.remove();
  extras.forEach((e) => e.remove());
  realBrief.style.visibility = '';
}
