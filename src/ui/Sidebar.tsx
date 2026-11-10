import { estVerrouille } from '../projet';
import type { Catalogue, Exercice } from '../types';

/** Chapitre ownership masqué : seule son intro reste visible. Les autres chapitres ne changent pas. */
export function estVisible(exercice: Exercice, ownershipComplet: boolean) {
  return exercice.module !== 'ownership' || ownershipComplet || exercice.intro;
}

// Un petit cadenas dessiné (les emojis s'affichent mal selon les polices).
function Cadenas() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

interface Props {
  catalogue: Catalogue;
  currentId: string;
  done: Record<string, boolean>;
  collapsed: boolean;
  inSettings: boolean;
  ownershipComplet: boolean;
  onSelect(id: string): void;
  onToggle(): void;
  onSettings(): void;
}

// La roue des réglages, la même que dans Nullforge.
function SettingsButton({ active, onClick }: { active: boolean; onClick(): void }) {
  return (
    <button className="sidebar-settings" onClick={onClick} aria-label="Réglages" aria-pressed={active} title="Réglages">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

export function Sidebar({ catalogue, currentId, done, collapsed, inSettings, ownershipComplet, onSelect, onToggle, onSettings }: Props) {
  // Le compteur ne voit que ce qui est affiché : masqué, l'app a l'air toute petite.
  const visibles = catalogue.exercices.filter((e) => estVisible(e, ownershipComplet));
  const total = visibles.length;
  const doneCount = visibles.filter((e) => done[e.id]).length;

  // Menu replié : une fine colonne avec le logo, la progression et le bouton pour rouvrir.
  if (collapsed) {
    return (
      <aside className="sidebar sidebar-rail">
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Déplier le menu" title="Déplier le menu (Ctrl + B)">
          »
        </button>
        <span className="brand-mark" aria-hidden>
          O
        </span>
        <span className="rail-count" aria-label={`${doneCount} exercices terminés sur ${total}`}>
          {doneCount}/{total}
        </span>
        <SettingsButton active={inSettings} onClick={onSettings} />
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <header className="brand">
        <span className="brand-mark" aria-hidden>
          O
        </span>
        <div className="brand-name">
          <h1>OxydeForge</h1>
          <p>La forge du Rust</p>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Replier le menu" title="Replier le menu (Ctrl + B)">
          «
        </button>
      </header>

      <div className="meter" aria-label={`${doneCount} exercices terminés sur ${total}`}>
        <div className="meter-track">
          <div className="meter-fill" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
        </div>
        <span>
          {doneCount}/{total}
        </span>
      </div>

      <SettingsButton active={inSettings} onClick={onSettings} />

      <nav className="module-list">
        {catalogue.modules.map((module) => (
          <section key={module.id} className={`module module-${module.id}`}>
            <h2>
              {module.titre}
              <small>{module.accroche}</small>
            </h2>
            <ol>
              {visibles
                .filter((e) => e.module === module.id)
                .map((exercice, index) => {
                  const verrou = estVerrouille(catalogue, exercice, done);
                  return (
                    <li key={exercice.id}>
                      <button
                        className={exercice.id === currentId ? 'nav-item active' : 'nav-item'}
                        aria-current={exercice.id === currentId ? 'true' : undefined}
                        disabled={verrou}
                        title={verrou ? 'Termine l’étape précédente pour débloquer celle-ci' : undefined}
                        onClick={() => onSelect(exercice.id)}
                      >
                        <span className={done[exercice.id] ? 'nav-state done' : 'nav-state'}>
                          {done[exercice.id] ? '✓' : verrou ? <Cadenas /> : String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{exercice.titre}</span>
                      </button>
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}
      </nav>
    </aside>
  );
}
