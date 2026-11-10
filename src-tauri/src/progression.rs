// Ta progression, rangée dans un vrai fichier : progression.json.
//
// Avant, elle vivait dans le localStorage de la fenêtre (le cache du navigateur
// intégré). Le 2026-11-09, ce cache est reparti de zéro après un arrêt du PC :
// 34 exercices réussis disparus. Un fichier écrit par le Rust ne dépend plus du navigateur.
//
// Où ? Dans le dossier de données de l'app :
//   C:\Users\<toi>\AppData\Roaming\com.oxydeforge.app\progression.json
//
// Le Rust ne regarde pas l'intérieur : il range le JSON tel que l'interface le donne.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde_json::Value;
use tauri::{AppHandle, Manager};

const FICHIER: &str = "progression.json";

fn chemin(app: &AppHandle) -> Result<PathBuf, String> {
    let dossier = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("dossier de données introuvable : {e}"))?;
    Ok(dossier.join(FICHIER))
}

/// Lit le fichier. `None` s'il n'existe pas encore (premier lancement).
fn lire(chemin: &Path) -> Result<Option<Value>, String> {
    match fs::read_to_string(chemin) {
        Ok(texte) => serde_json::from_str(&texte).map(Some).map_err(|e| {
            // Fichier abîmé : on le met de côté au lieu de l'écraser à la prochaine écriture.
            let _ = fs::rename(chemin, chemin.with_extension("json.corrompu"));
            format!("progression.json illisible, mis de côté en progression.json.corrompu : {e}")
        }),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("impossible de lire la progression : {e}")),
    }
}

/// Écrit sans jamais laisser un fichier à moitié écrit :
/// on écrit d'abord une copie temporaire, on force son passage sur le disque,
/// puis on la renomme. Si le PC s'éteint en plein milieu, l'ancien fichier reste intact.
fn ecrire(chemin: &Path, progression: &Value) -> Result<(), String> {
    let erreur = |e: std::io::Error| format!("impossible d'enregistrer la progression : {e}");
    if let Some(dossier) = chemin.parent() {
        fs::create_dir_all(dossier).map_err(erreur)?;
    }
    let temporaire = chemin.with_extension("json.tmp");
    let texte = serde_json::to_string_pretty(progression).map_err(|e| e.to_string())?;
    let mut fichier = fs::File::create(&temporaire).map_err(erreur)?;
    fichier.write_all(texte.as_bytes()).map_err(erreur)?;
    fichier.sync_all().map_err(erreur)?;
    drop(fichier);
    fs::rename(&temporaire, chemin).map_err(erreur)
}

#[tauri::command]
pub fn lire_progression(app: AppHandle) -> Result<Option<Value>, String> {
    lire(&chemin(&app)?)
}

#[tauri::command]
pub fn ecrire_progression(app: AppHandle, progression: Value) -> Result<(), String> {
    ecrire(&chemin(&app)?, &progression)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn dossier_de_test(nom: &str) -> PathBuf {
        let dossier = std::env::temp_dir().join(format!("oxydeforge-test-{nom}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dossier);
        dossier
    }

    #[test]
    fn premier_lancement_sans_fichier() {
        let chemin = dossier_de_test("absent").join(FICHIER);
        assert_eq!(lire(&chemin).unwrap(), None);
    }

    #[test]
    fn ecrire_puis_relire() {
        let dossier = dossier_de_test("aller-retour");
        let chemin = dossier.join(FICHIER);
        let progression = json!({ "done": { "cesar-6": true }, "drafts": { "cesar-6": "fn main() {}" } });
        ecrire(&chemin, &progression).unwrap();
        // On réécrit par-dessus : le renommage doit remplacer l'ancien fichier.
        ecrire(&chemin, &progression).unwrap();
        assert_eq!(lire(&chemin).unwrap(), Some(progression));
        assert!(!chemin.with_extension("json.tmp").exists());
        fs::remove_dir_all(dossier).unwrap();
    }
}
