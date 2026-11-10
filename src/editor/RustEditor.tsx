import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab, toggleComment } from '@codemirror/commands';
import { rustLanguage } from '@codemirror/lang-rust';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { bracketMatching, indentOnInput, indentUnit, LanguageSupport } from '@codemirror/language';
import { styleTags } from '@lezer/highlight';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { EditorState, Prec } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { oxydeTheme, parametre } from './theme';

// La grammaire Rust de base colore pareil un paramètre et un `let`.
// On lui ajoute une étiquette à part pour les paramètres de fonction : fn carre(x: i32).
const rustAvecParametres = new LanguageSupport(
  rustLanguage.configure({ props: [styleTags({ 'Parameter/BoundIdentifier': parametre })] }),
);

// L'apostrophe a deux vies en Rust :
//   'a'   → un caractère : on veut la paire '' automatiquement (ex. push('!'))
//   &'a   → une durée de vie : PAS de fermante
// On double donc l'apostrophe, sauf après une lettre (c'est, dans un commentaire), un & ou un <.
const apostropheAuto = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== "'" || from !== to) return false;
  const avant = view.state.sliceDoc(from - 1, from);
  const apres = view.state.sliceDoc(from, from + 1);
  // On retape l'apostrophe fermante qu'on avait ajoutée : on passe simplement par-dessus.
  if (apres === "'" && avant !== "'" && /[^\s(]/.test(avant)) {
    view.dispatch({ selection: { anchor: from + 1 } });
    return true;
  }
  if (/[\p{L}\p{N}_&<]/u.test(avant)) return false;
  if (apres && !/[\s)\]},;]/.test(apres)) return false;
  view.dispatch({ changes: { from, insert: "''" }, selection: { anchor: from + 1 } });
  return true;
});

export interface RustEditorHandle {
  focus(): void;
  setDoc(text: string): void;
  getDoc(): string;
}

interface Props {
  onChange(text: string): void;
  onRun(): void;
  onVerify(): void;
}

export const RustEditor = forwardRef<RustEditorHandle, Props>(function RustEditor({ onChange, onRun, onVerify }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun, onVerify });
  callbacks.current = { onChange, onRun, onVerify };

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          search({ top: true }),
          highlightSelectionMatches(),
          bracketMatching(),
          // Lignes d'indentation : une par niveau de bloc { }.
          // Le bloc où se trouve le curseur ressort en orange, pour se repérer.
          indentationMarkers({
            thickness: 1,
            activeThickness: 1,
            colors: {
              dark: '#2d3747',
              activeDark: 'rgba(255, 122, 26, 0.5)',
              light: '#2d3747',
              activeLight: 'rgba(255, 122, 26, 0.5)',
            },
          }),
          closeBrackets(),
          // Réindente la ligne quand on tape `}` : l'accolade se range toute seule.
          indentOnInput(),
          // 4 espaces : la convention de rustfmt.
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          rustAvecParametres,
          apostropheAuto,
          rustLanguage.data.of({
            // Pas de ' : en Rust il sert aussi aux durées de vie ('a), sans guillemet fermant.
            // `before` : les caractères devant lesquels on ferme automatiquement.
            // On ajoute `"` : dans println!("…{|"), l'accolade se ferme aussi.
            closeBrackets: { brackets: ['(', '[', '{', '"'], before: ')]}:;>"' },
          }),
          placeholder('// La forge est froide : à toi de taper.'),
          oxydeTheme,
          Prec.highest(
            keymap.of([
              { key: 'Mod-Enter', run: () => (callbacks.current.onRun(), true) },
              { key: 'Mod-Shift-Enter', run: () => (callbacks.current.onVerify(), true) },
              { key: 'Mod-/', run: toggleComment },
            ]),
          ),
          keymap.of([...closeBracketsKeymap, ...searchKeymap, ...historyKeymap, indentWithTab, ...defaultKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => editor.destroy();
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => view.current?.focus(),
    setDoc(text) {
      const v = view.current!;
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
    },
    getDoc: () => view.current!.state.doc.toString(),
  }));

  return <div className="editor-host" ref={host} />;
});
