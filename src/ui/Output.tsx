import { DANS_TAURI } from '../api';
import type { Execution } from '../types';
import { highlightRust, RustcOutput } from './Markdown';

// 1234 ms → « 1,23 s », 8 ms → « 8 ms »
function secondes(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`;
}

/** Mode web : ton code à côté de la solution, et ce que le programme doit afficher. */
export interface Comparaison {
  code: string;
  solution: string;
  attendu: string | null;
}

interface Props {
  busy: boolean;
  execution: Execution | null;
  probleme: string | null;
  comparaison?: Comparaison | null;
}

function VueComparaison({ code, solution, attendu }: Comparaison) {
  return (
    <div className="results">
      <div className="compare">
        <div className="compare-col">
          <p className="result-label">Ton code</p>
          <pre className="md-code">{highlightRust(code.trim() || '// (vide)')}</pre>
        </div>
        <div className="compare-col">
          <p className="result-label">La solution</p>
          <pre className="md-code">{highlightRust(solution.trim())}</pre>
        </div>
      </div>
      {attendu && (
        <>
          <p className="result-label">Ce que le programme doit afficher</p>
          <pre className="program-output">{attendu.trim()}</pre>
        </>
      )}
      <p className="compare-note">
        Pas besoin d’un code identique : des noms de variables différents, c’est très bien. Ce qui compte, c’est que ton
        programme affiche <strong>exactement</strong> ce texte. Pour le vérifier pour de vrai, compile-le dans OxydeForge sur
        ton PC.
      </p>
    </div>
  );
}

export function OutputPanel({ busy, execution, probleme, comparaison }: Props) {
  return (
    <section className="output">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected="true">
          {comparaison ? 'Comparaison' : 'Résultats'}
        </button>
      </div>
      <div className="output-body">
        {comparaison ? (
          <VueComparaison {...comparaison} />
        ) : !DANS_TAURI && !execution && !probleme ? (
          <p className="empty">
            Ici, pas de compilateur : écris ton programme, puis compare-le à la solution avec Ctrl + Entrée.
          </p>
        ) : busy ? (
          <p className="empty working">Compilation en cours…</p>
        ) : probleme ? (
          <p className="empty problem">{probleme}</p>
        ) : !execution ? (
          <p className="empty">Rien pour l’instant. Écris ton programme, puis lance-le avec Ctrl + Entrée.</p>
        ) : (
          <div className="results">
            {!execution.compile && (
              <>
                <p className="result-tag fail">✗ Le compilateur refuse ton code</p>
                <RustcOutput text={execution.compilateur} />
              </>
            )}

            {execution.compile && (
              <>
                <p className="result-tag ok">✓ Compilé</p>
                {execution.compilateur.trim() && (
                  <>
                    <p className="result-label">Avertissements du compilateur</p>
                    <RustcOutput text={execution.compilateur} />
                  </>
                )}
                <p className="result-label">Ce que ton programme affiche</p>
                <pre className="program-output">{execution.sortie || '(rien)'}</pre>
                {execution.sortie_erreur.trim() && <pre className="program-output program-error">{execution.sortie_erreur}</pre>}
                {execution.trop_long && <p className="result-tag fail">⏱ Arrêté au bout de 5 secondes : une boucle sans fin ?</p>}
                {!execution.trop_long && execution.code_sortie !== 0 && (
                  <p className="result-tag fail">Le programme s'est arrêté en erreur (code {execution.code_sortie ?? '?'}).</p>
                )}
              </>
            )}

            <p className="timing">
              ⏱ Compilation : {secondes(execution.duree_compilation_ms)}
              {execution.compile && <> · Exécution : {secondes(execution.duree_execution_ms)}</>}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
