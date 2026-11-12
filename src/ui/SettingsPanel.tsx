import { useState } from 'react';
import { ouvrirLien } from '../api';
import { getSettings, TEXT_SIZES, updateSettings, type Settings } from '../settings';

interface Props {
  ownershipComplet: boolean;
  onToggleOwnership(complet: boolean): void;
  onReset(): void;
  /** Chaque module, avec son nombre d'exercices réussis. */
  modules: { id: string; titre: string; faits: number }[];
  onResetModule(id: string): void;
  onClose(): void;
}

export function SettingsPanel({ ownershipComplet, onToggleOwnership, onReset, modules, onResetModule, onClose }: Props) {
  const [settings, setSettings] = useState(getSettings);
  const change = (patch: Partial<Settings>) => setSettings(updateSettings(patch));
  // Effacer la progression demande deux clics : on ne perd pas tout sur une fausse manip.
  const [confirmer, setConfirmer] = useState(false);
  // Pareil pour un module : l'id du module « armé », en attente du second clic.
  const [moduleArme, setModuleArme] = useState<string | null>(null);

  return (
    <section className="settings-panel">
      <div className="settings-card">
        <h2>Réglages</h2>

        <h3>Taille du texte</h3>
        <p className="settings-help">Agrandit tout : leçons, menu, éditeur et résultats.</p>
        <div className="settings-sizes">
          {TEXT_SIZES.map((size) => (
            <button key={size.scale} aria-pressed={settings.textScale === size.scale} onClick={() => change({ textScale: size.scale })}>
              {size.label}
            </button>
          ))}
        </div>

        <h3>Documentation officielle</h3>
        <p className="settings-help">
          La bibliothèque standard de Rust : chaque type (<code>String</code>, <code>i32</code>, <code>Vec</code>…) et toutes ses
          méthodes. En anglais. Hors ligne, la même doc s’ouvre avec <code>rustup doc --std</code>.
        </p>
        <button className="settings-link" onClick={() => ouvrirLien('std')}>
          doc.rust-lang.org/std <span aria-hidden="true">↗</span>
        </button>

        <div className="settings-zone zone-verte">
          <h3>Zone verte</h3>
          <p className="settings-help">
            Le chapitre « Possession et emprunt » ne montre d’abord que son intro : la pile et le tas, puis le lingot. Allume ici
            pour afficher <strong>tout</strong> le chapitre.
          </p>
          <button className="zone-toggle" aria-pressed={ownershipComplet} onClick={() => onToggleOwnership(!ownershipComplet)}>
            <span className="zone-switch" aria-hidden />
            {ownershipComplet ? 'Tout le chapitre est affiché' : 'Afficher tout le chapitre'}
          </button>
        </div>

        <div className="settings-zone zone-danger">
          <h3>DANGER</h3>
          <p className="settings-help">
            Efface toute ta progression : exercices réussis et brouillons. <strong>Impossible à annuler.</strong>
          </p>
          {confirmer ? (
            <div className="danger-confirm" role="alert">
              <span>Sûr ? Tout sera effacé.</span>
              <button className="danger-go" onClick={onReset}>
                Oui, tout effacer
              </button>
              <button className="danger-cancel" autoFocus onClick={() => setConfirmer(false)}>
                Annuler
              </button>
            </div>
          ) : (
            <button className="danger-button" onClick={() => setConfirmer(true)}>
              Réinitialiser ma progression
            </button>
          )}

          <h3>Un seul module</h3>
          <p className="settings-help">Efface les exercices réussis et les brouillons d’un module. Les autres ne bougent pas.</p>
          <ul className="danger-modules">
            {modules.map((m) => (
              <li key={m.id}>
                <span>
                  {m.titre} <span className="danger-count">· {m.faits} réussi{m.faits > 1 ? 's' : ''}</span>
                </span>
                {moduleArme === m.id ? (
                  <span className="danger-confirm" role="alert">
                    <button
                      className="danger-go"
                      onClick={() => {
                        onResetModule(m.id);
                        setModuleArme(null);
                      }}
                    >
                      Oui, effacer
                    </button>
                    <button className="danger-cancel" autoFocus onClick={() => setModuleArme(null)}>
                      Annuler
                    </button>
                  </span>
                ) : (
                  <button className="danger-button" disabled={m.faits === 0} onClick={() => setModuleArme(m.id)}>
                    Réinitialiser
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button className="primary settings-done" onClick={onClose}>
          Valider
        </button>
      </div>
    </section>
  );
}
