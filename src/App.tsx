import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { chargerCatalogue, DANS_TAURI, ecrireProgressionFichier, executer, lireProgressionFichier, verifier } from './api';
import { RustEditor, type RustEditorHandle } from './editor/RustEditor';
import { loadProgress, loadSidebarCollapsed, saveProgress, saveSidebarCollapsed, type Progress } from './progress';
import { getSettings, updateSettings } from './settings';
import type { Catalogue, Execution, Verdict } from './types';
import { fusionner, ouvrirCloud, type EtatCloud } from './cloud';
import { BootScreen } from './ui/BootScreen';
import { Brief, type ReactionKael } from './ui/Brief';
import { Demo } from './ui/Demo';
import { accueilDejaVu, ALERTES, BRAVOS, DOUTES, KaelAccueil, KaelRevelation } from './ui/Kael';
import { OutputPanel } from './ui/Output';
import { PileTas } from './ui/PileTas';
import { SettingsPanel } from './ui/SettingsPanel';
import { estVisible, Sidebar } from './ui/Sidebar';
import { capture, play, type Snapshot } from './ui/transition';
import { etapePrecedente } from './projet';

// Le voyant de la barre d'outils, en mode web : où est gardée la progression.
const LIBELLE_CLOUD: Record<EtatCloud, string> = {
  absent: 'MODE NAVIGATEUR · PROGRESSION SUR CET APPAREIL',
  connexion: 'MODE NAVIGATEUR · CONNEXION…',
  synchronise: 'MODE NAVIGATEUR · PROGRESSION EN LIGNE',
  'hors-ligne': 'MODE NAVIGATEUR · HORS LIGNE, GARDÉE ICI',
};

export function App() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [probleme, setProbleme] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarCollapsed);
  const [accueil, setAccueil] = useState(false);
  const [bravo, setBravo] = useState('');
  const [inSettings, setInSettings] = useState(false);
  // Chapitre ownership : masqué (seulement l'intro) tant qu'on n'a pas fini le lingot ou allumé la zone verte.
  const [ownershipComplet, setOwnershipComplet] = useState(() => getSettings().ownershipComplet);
  // Le pop-up de Kael à la fin de l'intro.
  const [revelation, setRevelation] = useState(false);
  // Kael réagit aux compilations, et les bords de la fenêtre s'allument si le code est refusé.
  const [reaction, setReaction] = useState<ReactionKael | null>(null);
  const [alerte, setAlerte] = useState(0); // 0 : éteinte ; sinon, change à chaque refus (relance l'animation)
  const secousses = useRef(0);
  // Photo de l'exercice quitté : la transition se joue une fois le suivant affiché.
  const pendingSwap = useRef<Snapshot | null>(null);
  // Mode web (artefact) : pas de rustc. On compare à la solution, puis on valide soi-même.
  const [comparaison, setComparaison] = useState(false);
  const [webReussi, setWebReussi] = useState(false);
  const [etatCloud, setEtatCloud] = useState<EtatCloud>('absent');
  const cloud = useRef<Awaited<ReturnType<typeof ouvrirCloud>>>(null);

  // La progression en ligne (artefact claude.ai) : reçue au démarrage, puis enregistrée à chaque changement.
  useEffect(() => {
    if (DANS_TAURI) return;
    let arreter: (() => void) | undefined;
    let annule = false;
    ouvrirCloud().then((c) => {
      if (!c || annule) return;
      cloud.current = c;
      arreter = c.ecouter((distant) => {
        setProgress((local) => {
          const fusion = fusionner(local, distant);
          saveProgress(fusion);
          return fusion;
        });
      }, setEtatCloud);
    });
    return () => {
      annule = true;
      arreter?.();
    };
  }, []);

  useEffect(() => {
    cloud.current?.enregistrer(progress);
  }, [progress]);

  // Dans la fenêtre Tauri : la progression vit dans progression.json (écrit par le Rust).
  // Le localStorage ne sert plus que de copie de secours.
  // Piège évité : ne JAMAIS écrire le fichier avant de l'avoir lu, sinon une
  // progression vide au démarrage écraserait la vraie.
  const fichierLu = useRef(false);
  useEffect(() => {
    if (!DANS_TAURI) return;
    lireProgressionFichier()
      .then((fichier) => {
        if (fichier) {
          setProgress((local) => {
            const fusion = fusionner(local, fichier);
            saveProgress(fusion);
            return fusion;
          });
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        fichierLu.current = true;
        setProgress((p) => ({ ...p })); // relance l'écriture ci-dessous
      });
  }, []);

  useEffect(() => {
    if (!DANS_TAURI || !fichierLu.current) return;
    const minuteur = setTimeout(() => ecrireProgressionFichier(progress).catch((e) => console.error(e)), 400);
    return () => clearTimeout(minuteur);
  }, [progress]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);
  useEffect(() => saveSidebarCollapsed(sidebarCollapsed), [sidebarCollapsed]);

  // Ctrl + B replie ou déplie le menu, comme dans Nullforge.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);
  const editor = useRef<RustEditorHandle>(null);
  const opening = useRef(false);

  const endBoot = useCallback(() => {
    setBooting(false);
    // Premier passage à la fonderie : Kael se présente.
    if (!accueilDejaVu()) setAccueil(true);
    editor.current?.focus();
  }, []);

  useEffect(() => {
    chargerCatalogue().then(
      (c) => {
        setCatalogue(c);
        setCurrentId((id) => id ?? c.exercices[0]?.id ?? null);
      },
      (e) => setErreurChargement(String(e)),
    );
  }, []);

  const exercice = catalogue?.exercices.find((e) => e.id === currentId);
  const module = catalogue?.modules.find((m) => m.id === exercice?.module);
  const index = catalogue && exercice ? catalogue.exercices.indexOf(exercice) : -1;
  const suivant = catalogue?.exercices[index + 1];

  const auHasard = (liste: string[]) => liste[Math.floor(Math.random() * liste.length)];

  // Ce que fait Kael après une compilation.
  const reagir = useCallback((execution: Execution, reussi?: boolean) => {
    if (!execution.compile) {
      secousses.current += 1;
      setReaction({ humeur: 'inquiet', texte: auHasard(ALERTES), secousse: secousses.current });
      setAlerte(secousses.current);
      return;
    }
    setAlerte(0);
    if (reussi === false) {
      setReaction({ humeur: 'sceptique', texte: auHasard(DOUTES), secousse: 0 });
    } else if (reussi) {
      setReaction({ humeur: Math.random() < 0.5 ? 'heureux' : 'amuse', texte: null, secousse: 0 });
    } else {
      setReaction(null); // compilé après Exécuter : Kael se calme et reprend son bon de travail
    }
  }, []);

  // Passer à l'exercice suivant après une réussite : avec la transition animée.
  const goToNext = useCallback(() => {
    if (!suivant) return;
    if (suivant.type !== 'demo') pendingSwap.current = capture(editor.current?.getDoc() ?? '');
    setCurrentId(suivant.id);
  }, [suivant]);

  // Le nouvel exercice est rendu (mais pas encore peint) : on pose la transition par-dessus.
  useLayoutEffect(() => {
    const snapshot = pendingSwap.current;
    if (!snapshot) return;
    pendingSwap.current = null;
    void play(snapshot);
  }, [currentId]);

  const updateProgress = useCallback((change: (p: Progress) => Progress) => {
    setProgress((current) => {
      const updated = change(current);
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Zone verte : afficher ou masquer le reste du chapitre ownership.
  const basculerOwnership = useCallback(
    (complet: boolean) => {
      setOwnershipComplet(complet);
      updateSettings({ ownershipComplet: complet });
      // On masque l'exercice ouvert ? Retour au début de l'intro.
      if (catalogue && exercice && !estVisible(exercice, complet)) {
        setCurrentId(catalogue.exercices.find((e) => e.module === 'ownership' && e.intro)?.id ?? null);
      }
    },
    [catalogue, exercice],
  );

  // Zone DANGER : on repart de zéro (progression vide, chapitre de nouveau masqué).
  const reinitialiser = useCallback(() => {
    updateProgress(() => ({ done: {}, drafts: {} }));
    setOwnershipComplet(false);
    updateSettings({ ownershipComplet: false });
    setCurrentId(catalogue?.exercices[0]?.id ?? null);
    setInSettings(false);
  }, [catalogue, updateProgress]);

  // Un seul module : ses ✓ et ses brouillons disparaissent, le reste ne bouge pas.
  const reinitialiserModule = useCallback(
    (moduleId: string) => {
      const ids = new Set(catalogue?.exercices.filter((e) => e.module === moduleId).map((e) => e.id));
      const garder = (table: Record<string, unknown>) => Object.fromEntries(Object.entries(table).filter(([id]) => !ids.has(id)));
      updateProgress((p) => ({ done: garder(p.done) as Progress['done'], drafts: garder(p.drafts) as Progress['drafts'] }));
      // Ownership repart de zéro : son intro redevient la porte d'entrée du chapitre.
      if (moduleId === 'ownership') {
        setOwnershipComplet(false);
        updateSettings({ ownershipComplet: false });
      }
    },
    [catalogue, updateProgress],
  );

  // Dernière étape de l'intro réussie, chapitre encore masqué : Kael surgit.
  const verifierRevelation = useCallback(
    (id: string) => {
      const intro = catalogue?.exercices.filter((e) => e.module === 'ownership' && e.intro) ?? [];
      if (!ownershipComplet && id === intro[intro.length - 1]?.id) setRevelation(true);
    },
    [catalogue, ownershipComplet],
  );

  // À l'ouverture d'un exercice : éditeur vide, ou ton brouillon s'il existe.
  // (Aussi au retour des réglages : l'éditeur a été démonté, il faut le remplir à nouveau.)
  useEffect(() => {
    if (!exercice || inSettings) return;
    opening.current = true;
    const drafts = loadProgress().drafts;
    const precedente = catalogue && etapePrecedente(catalogue, exercice);
    editor.current?.setDoc(drafts[exercice.id] ?? (precedente ? drafts[precedente.id] : undefined) ?? '');
    opening.current = false;
    setExecution(null);
    setVerdict(null);
    setProbleme(null);
    setReaction(null);
    setAlerte(0);
    setComparaison(false);
    setWebReussi(false);
    editor.current?.focus();
  }, [exercice, inSettings]);

  // ── Réinitialiser l'exercice : efface le brouillon, garde le ✓ ──
  // Deux clics : le premier arme le bouton, le second efface.
  const [confirmeReset, setConfirmeReset] = useState(false);
  useEffect(() => setConfirmeReset(false), [exercice]);

  const reinitialiserExercice = useCallback(() => {
    if (!exercice) return;
    updateProgress((p) => {
      const { [exercice.id]: _old, ...others } = p.drafts;
      return { ...p, drafts: others };
    });
    // Comme à l'ouverture : éditeur vide, ou le code de l'étape d'avant pour un exercice enchaîné.
    const precedente = catalogue && etapePrecedente(catalogue, exercice);
    opening.current = true;
    editor.current?.setDoc((precedente ? loadProgress().drafts[precedente.id] : undefined) ?? '');
    opening.current = false;
    setExecution(null);
    setVerdict(null);
    setProbleme(null);
    setComparaison(false);
    setWebReussi(false);
    setConfirmeReset(false);
    editor.current?.focus();
  }, [catalogue, exercice, updateProgress]);

  // ── Mode web : comparer, puis valider soi-même ──
  const comparer = useCallback(() => {
    setComparaison(true);
    setReaction({
      humeur: 'sourire-en-coin',
      texte: 'Alors, ça ressemble ? Compare bien les deux, ligne par ligne. Les détails comptent : un point-virgule, une majuscule…',
      secousse: 0,
    });
  }, []);

  const valider = useCallback(() => {
    if (!exercice) return;
    if (webReussi && suivant) {
      goToNext();
      return;
    }
    setWebReussi(true);
    setBravo(BRAVOS[Math.floor(Math.random() * BRAVOS.length)]);
    setReaction({ humeur: Math.random() < 0.5 ? 'heureux' : 'amuse', texte: null, secousse: 0 });
    updateProgress((p) => ({ ...p, done: { ...p.done, [exercice.id]: true } }));
    verifierRevelation(exercice.id);
  }, [exercice, goToNext, suivant, updateProgress, verifierRevelation, webReussi]);

  const onChange = useCallback(
    (text: string) => {
      if (opening.current || !currentId) return;
      updateProgress((p) => {
        const { [currentId]: _old, ...others } = p.drafts;
        return { ...p, drafts: text.trim() ? { ...others, [currentId]: text } : others };
      });
    },
    [currentId, updateProgress],
  );

  // Une démo compte comme faite quand on arrive à sa dernière étape.
  const finishDemo = useCallback(() => {
    if (exercice) updateProgress((p) => ({ ...p, done: { ...p.done, [exercice.id]: true } }));
  }, [exercice, updateProgress]);

  const run = useCallback(async () => {
    if (busy || !editor.current) return;
    setBusy(true);
    setProbleme(null);
    // Le code a peut-être changé depuis le dernier Vérifier : ses ✓ / ✗ ne valent plus.
    setVerdict(null);
    try {
      const execution = await executer(editor.current.getDoc());
      setExecution(execution);
      reagir(execution);
    } catch (e) {
      setProbleme(String(e));
    }
    setBusy(false);
  }, [busy, reagir]);

  const verify = useCallback(async () => {
    if (busy || !editor.current || !exercice) return;
    // Exercice déjà réussi : Ctrl + Maj + Entrée passe au suivant.
    if (verdict?.reussi && suivant) {
      goToNext();
      return;
    }
    setBusy(true);
    setProbleme(null);
    try {
      const v = await verifier(exercice.id, editor.current.getDoc());
      setVerdict(v);
      setExecution(v.execution);
      reagir(v.execution, v.reussi);
      if (v.reussi) {
        setBravo(BRAVOS[Math.floor(Math.random() * BRAVOS.length)]);
        updateProgress((p) => ({ ...p, done: { ...p.done, [exercice.id]: true } }));
        verifierRevelation(exercice.id);
      }
    } catch (e) {
      setProbleme(String(e));
    }
    setBusy(false);
    editor.current?.focus();
  }, [busy, exercice, goToNext, reagir, suivant, updateProgress, verdict, verifierRevelation]);

  if (erreurChargement) {
    return (
      <div className="boot">
        <strong>Impossible de charger les exercices.</strong>
        <pre>{erreurChargement}</pre>
      </div>
    );
  }

  const boot = booting && <BootScreen ready={Boolean(catalogue)} onGone={endBoot} />;

  if (!catalogue || !exercice || !module) return boot || <div className="boot">Allumage de la forge…</div>;

  return (
    <div className={`app${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {boot}
      <Sidebar
        catalogue={catalogue}
        currentId={exercice.id}
        done={progress.done}
        collapsed={sidebarCollapsed}
        inSettings={inSettings}
        ownershipComplet={ownershipComplet}
        onSelect={(id) => {
          setInSettings(false);
          setCurrentId(id);
        }}
        onToggle={toggleSidebar}
        onSettings={() => setInSettings((s) => !s)}
      />

      {accueil && <KaelAccueil onClose={() => setAccueil(false)} />}

      {revelation && (
        <KaelRevelation
          onClose={() => {
            setRevelation(false);
            basculerOwnership(true);
            goToNext();
          }}
        />
      )}

      {/* ALERTE, CHEF : les bords s'allument en rouge. La clé relance l'animation à chaque refus. */}
      <div key={alerte} className={`alarme${alerte ? ' on' : ''}`} aria-hidden />
      {alerte > 0 && (
        <p className="sr-only" role="alert">
          Le compilateur a refusé ton code.
        </p>
      )}

      {inSettings ? (
        <SettingsPanel
          ownershipComplet={ownershipComplet}
          onToggleOwnership={basculerOwnership}
          onReset={reinitialiser}
          modules={(catalogue?.modules ?? []).map((m) => ({
            id: m.id,
            titre: m.titre,
            faits: catalogue?.exercices.filter((e) => e.module === m.id && progress.done[e.id]).length ?? 0,
          }))}
          onResetModule={reinitialiserModule}
          onClose={() => setInSettings(false)}
        />
      ) : exercice.type === 'demo' ? (
        // Chaque démo a son propre écran animé.
        exercice.id === 'own-01' ? (
          <PileTas exercice={exercice} onFinish={finishDemo} onNext={suivant && goToNext} />
        ) : (
          <Demo exercice={exercice} onFinish={finishDemo} onNext={suivant && goToNext} />
        )
      ) : (
      <>
      <Brief
        exercice={exercice}
        module={module}
        verdict={verdict}
        reaction={reaction}
        onLoadSolution={() => {
          editor.current?.setDoc(exercice.solution.trim() + '\n');
          editor.current?.focus();
        }}
      />

      <main className="workspace">
        <div className="toolbar">
          <span className={`forge-light${busy ? ' busy' : ''}`}>
            <i aria-hidden />
            {DANS_TAURI ? (busy ? 'COMPILATION…' : 'FORGE PRÊTE') : LIBELLE_CLOUD[etatCloud]}
          </span>
          {DANS_TAURI ? (
            <div className="toolbar-actions">
              <button className="secondary" onClick={run} disabled={busy}>
                Exécuter <kbd>Ctrl ↵</kbd>
              </button>
              <button className="primary" onClick={verify} disabled={busy}>
                Vérifier <kbd>Ctrl ⇧ ↵</kbd>
              </button>
            </div>
          ) : (
            <div className="toolbar-actions">
              <button className="secondary" onClick={comparer}>
                Comparer à la solution <kbd>Ctrl ↵</kbd>
              </button>
              <button className="primary" onClick={valider}>
                C’est bon, je valide <kbd>Ctrl ⇧ ↵</kbd>
              </button>
            </div>
          )}
        </div>

        <div className="editor-pane">
          <RustEditor
            ref={editor}
            onChange={onChange}
            onRun={DANS_TAURI ? run : comparer}
            onVerify={DANS_TAURI ? verify : valider}
          />
        </div>

        {progress.done[exercice.id] && (
          <div className="editor-footer">
            {confirmeReset ? (
              <>
                <span className="reset-question">Effacer ton code ? Le ✓ reste.</span>
                <button className="reset-go" onClick={reinitialiserExercice}>
                  Oui, effacer
                </button>
                <button className="reset-cancel" onClick={() => setConfirmeReset(false)}>
                  Annuler
                </button>
              </>
            ) : (
              <button className="reset-button" onClick={() => setConfirmeReset(true)}>
                ↺ Réinitialiser l’exercice
              </button>
            )}
          </div>
        )}

        {(verdict?.reussi || webReussi) && (
          <div className="victory" role="status">
            <div>
              <strong>Exercice réussi</strong>
              {bravo && <span className="victory-kael">Kael : « {bravo} »</span>}
            </div>
            {suivant && (
              <button className="primary" onClick={goToNext}>
                Exercice suivant <kbd>Ctrl ⇧ ↵</kbd>
              </button>
            )}
          </div>
        )}

        <OutputPanel
          busy={busy}
          execution={execution}
          probleme={probleme}
          comparaison={
            comparaison
              ? { code: editor.current?.getDoc() ?? '', solution: exercice.solution, attendu: exercice.sortie_attendue }
              : null
          }
        />
      </main>
      </>
      )}
    </div>
  );
}
