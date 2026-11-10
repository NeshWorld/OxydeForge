import type { ReactNode } from 'react';

// Mini-markdown des leçons (les champs lecon et mission des fichiers TOML) :
// **gras**, *italique*, `code`, listes « - », tableaux « | », citations « > »
// et blocs ```rust … ```.

const RUST_KEYWORDS =
  'fn|let|mut|if|else|match|loop|while|for|in|return|struct|enum|impl|trait|pub|use|mod|const|static|as|ref|self|Self|move|break|continue|where|type|unsafe|true|false';
// Un paramètre de fonction : un nom juste après `(` ou `,` (avec un éventuel `mut`), suivi de `:`.
// Exemple : fn carre(x: i32) → x. Un `let x: i32` n'est PAS concerné (précédé de let).
const PARAM = '(?<=[(,]\\s*(?:mut\\s+)?)[a-z_][a-z0-9_]*(?=\\s*:[^:])';
const RUST_TOKENS = new RegExp(`(//.*$|"(?:[^"\\\\]|\\\\.)*"|${PARAM}|\\b[a-z_][a-z0-9_]*!|\\b(?:${RUST_KEYWORDS})\\b|\\b\\d[\\d_]*(?:\\.\\d+)?\\b|\\b[A-Z][A-Za-z0-9]*\\b)`, 'gm');

function tokenClass(part: string) {
  if (part.startsWith('//')) return 'tok-comment';
  if (part.startsWith('"')) return 'tok-string';
  if (part.endsWith('!')) return 'tok-macro';
  if (/^\d/.test(part)) return 'tok-number';
  if (/^[A-Z]/.test(part) && part !== 'Self') return 'tok-type';
  if (/^[a-z_]/.test(part) && !new RegExp(`^(?:${RUST_KEYWORDS})$`).test(part)) return 'tok-param';
  return 'tok-keyword';
}

export function highlightRust(code: string) {
  return code.split(RUST_TOKENS).map((part, i) =>
    i % 2 === 0 ? (
      part
    ) : (
      <span key={i} className={tokenClass(part)}>
        {part}
      </span>
    ),
  );
}

// Le gras et l'italique peuvent contenir du `code`, même avec des * dedans : **bloc : `/* … */`**.
const INLINE = /(`[^`]+`|\*\*(?:[^*`]|`[^`]*`)+\*\*|\*(?:[^*`]|`[^`]*`)+\*)/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
        if (part.startsWith('**')) {
          return (
            <strong key={i}>
              <Inline text={part.slice(2, -2)} />
            </strong>
          );
        }
        if (part.startsWith('*') && part.length > 2) {
          return (
            <em key={i}>
              <Inline text={part.slice(1, -1)} />
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.trim().split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) code.push(lines[i]);
      i++;
      const text = code.join('\n');
      blocks.push(
        <pre key={i} className="md-code">
          {lang === 'rust' ? highlightRust(text) : text}
        </pre>,
      );
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      for (; lines[i]?.startsWith('- '); i++) items.push(lines[i].slice(2));
      blocks.push(
        <ul key={i}>
          {items.map((item, n) => (
            <li key={n}>
              <Inline text={item} />
            </li>
          ))}
        </ul>,
      );
    } else if (line.startsWith('|')) {
      // 1re ligne = en-têtes, 2e = séparateur |---|, puis les lignes.
      const rows: string[][] = [];
      for (; lines[i]?.startsWith('|'); i++) {
        // `\|` dans une cellule = une vraie barre, pas une séparation de colonnes.
        rows.push(
          lines[i]
            .trim()
            .replace(/^\||\|$/g, '')
            .split(/(?<!\\)\|/)
            .map((cell) => cell.trim().replace(/\\\|/g, '|')),
        );
      }
      const [head, , ...body] = rows;
      blocks.push(
        <div key={i} className="md-table">
          <table>
            <thead>
              <tr>
                {head.map((cell, n) => (
                  <th key={n}>
                    <Inline text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, n) => (
                    <td key={n}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={i}>
          <Inline text={line.slice(2)} />
        </blockquote>,
      );
      i++;
    } else {
      blocks.push(
        <p key={i}>
          <Inline text={line} />
        </p>,
      );
      i++;
    }
  }
  return <div className="md">{blocks}</div>;
}

// Un message de rustc, coloré ligne par ligne comme dans un terminal.
export function RustcOutput({ text }: { text: string }) {
  return (
    <pre className="rustc">
      {text
        .trim()
        .split('\n')
        .map((line, i) => {
          const kind = line.startsWith('error')
            ? 'rustc-error'
            : line.startsWith('warning')
              ? 'rustc-warning'
              : line.startsWith('help')
                ? 'rustc-help'
                : /^\s*(\d+\s*)?\|/.test(line) || line.trimStart().startsWith('-->')
                  ? 'rustc-gutter'
                  : '';
          return (
            <span key={i} className={kind}>
              {line}
              {'\n'}
            </span>
          );
        })}
    </pre>
  );
}
