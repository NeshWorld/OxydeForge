import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { Tag, tags as t } from '@lezer/highlight';

/** Étiquette des paramètres de fonction (voir RustEditor.tsx). */
export const parametre = Tag.define();

const editorTheme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: 'var(--bg-editor)', color: 'var(--text)', fontSize: '0.875rem' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.65', overflow: 'auto' },
    '.cm-content': { caretColor: 'var(--accent)', padding: '14px 0' },
    '.cm-cursor': { borderLeft: '2px solid var(--accent)' },
    '.cm-gutters': { backgroundColor: 'var(--bg-editor)', color: 'var(--text-faint)', border: 'none', paddingLeft: '8px' },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 122, 26, 0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--accent)' },
    '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'rgba(98, 176, 255, 0.28)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      // Bien visible, mais en BLEU : le curseur est orange, il doit rester visible par-dessus.
      backgroundColor: 'rgba(98, 176, 255, 0.3)',
      color: '#fff',
      fontWeight: '700',
      outline: '1px solid var(--info)',
      borderRadius: '2px',
      textShadow: '0 0 6px var(--info)',
    },
    '.cm-nonmatchingBracket': { backgroundColor: 'rgba(255, 61, 127, 0.3)', color: 'var(--danger)' },
    '.cm-placeholder': { color: 'var(--text-faint)', fontStyle: 'normal' },
    '.cm-tooltip': { backgroundColor: 'var(--bg-raised)', border: '1px solid var(--line-strong)', color: 'var(--text)' },
    '.cm-panels': { backgroundColor: 'var(--bg-raised)', color: 'var(--text)' },
  },
  { dark: true },
);

// Les couleurs viennent des variables --syn-* de styles.css.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.self], color: 'var(--syn-keyword)', fontWeight: '600' },
  // println!, vec!, format! : une macro prend la couleur de l'accent.
  { tag: t.macroName, color: 'var(--syn-macro)' },
  { tag: parametre, color: 'var(--syn-param)' },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--syn-type)' },
  { tag: [t.string, t.special(t.string), t.character], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool], color: 'var(--syn-number)' },
  { tag: t.labelName, color: 'var(--syn-number)' },
  { tag: [t.lineComment, t.blockComment], color: 'var(--text-faint)', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--text-dim)' },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: 'var(--text)' },
]);

export const oxydeTheme = [editorTheme, syntaxHighlighting(highlight)];
