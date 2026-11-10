// Charge les exercices depuis le dossier exercices/ (un fichier TOML par exercice).
//
// serde fait le gros du travail : #[derive(Deserialize)] lui apprend à remplir
// une struct à partir d'un texte TOML, champ par champ, en vérifiant les types.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Un module de la barre latérale (« Les bases », « Lis l'erreur »…).
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Module {
    pub id: String,
    pub titre: String,
    pub accroche: String,
    /// Un projet : ses étapes se débloquent l'une après l'autre,
    /// et chaque étape reprend le code de la précédente.
    #[serde(default)]
    pub projet: bool,
}

/// Les sortes d'exercice. Dans le TOML : type = "lecon", "lis-erreur"…
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum TypeExercice {
    Lecon,
    LisErreur,
    Introspection,
    Defi,
    /// Pas un exercice : une démonstration animée, pas à pas.
    Demo,
    /// Une étape d'un projet (module avec projet = true).
    Etape,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Exercice {
    pub id: String,
    pub module: String,
    pub titre: String,
    pub notion: String,
    // `type` est un mot réservé en Rust : r# permet quand même de l'utiliser comme nom.
    pub r#type: TypeExercice,
    /// Un mini-projet dans un module normal : les étapes qui partagent ce nom
    /// s'enchaînent (verrou + code repris de l'étape précédente). Ex. "lingot".
    #[serde(default)]
    pub chaine: Option<String>,
    /// Reste visible même quand le reste du chapitre est masqué (réglage « zone verte »).
    #[serde(default)]
    pub intro: bool,
    /// Ce que dit Kael, le technicien de la fonderie, en tête de l'exercice.
    #[serde(default)]
    pub kael: Option<String>,
    /// Le visage de Kael pour cet exercice (un fichier de src/assets/kael/). Sinon : selon le type.
    #[serde(default)]
    pub humeur: Option<String>,
    pub lecon: String,
    /// Un aparté facultatif, replié sous « Digression » (le pourquoi du comment).
    #[serde(default)]
    pub digression: Option<String>,
    pub mission: String,
    // Option : le champ peut manquer dans le fichier (None). Seuls les « lis-erreur » l'ont.
    #[serde(default)]
    pub code_casse: Option<String>,
    #[serde(default)]
    pub erreur: Option<String>,
    /// Ce que le programme doit afficher, exactement. Sert au bouton Vérifier.
    #[serde(default)]
    pub sortie_attendue: Option<String>,
    /// Pour un « lis-erreur » : le code qui doit avoir disparu (ex. "E0384").
    #[serde(default)]
    pub erreur_corrigee: Option<String>,
    #[serde(default)]
    pub criteres: Vec<String>,
    #[serde(default)]
    pub indices: Vec<String>,
    pub solution: String,
}

/// Ce que l'interface reçoit d'un coup au démarrage.
#[derive(Debug, Serialize)]
pub struct Catalogue {
    pub modules: Vec<Module>,
    pub exercices: Vec<Exercice>,
}

#[derive(Deserialize)]
struct FichierModules {
    modules: Vec<Module>,
}

/// Le dossier exercices/, à la racine du projet.
/// CARGO_MANIFEST_DIR = le dossier de Cargo.toml (src-tauri), connu à la compilation.
fn dossier_exercices() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("exercices")
}

fn lire(chemin: &Path) -> Result<String, String> {
    fs::read_to_string(chemin).map_err(|e| format!("{} : {e}", chemin.display()))
}

/// Commande appelée par l'interface : invoke('charger_catalogue').
#[tauri::command]
pub fn charger_catalogue() -> Result<Catalogue, String> {
    charger_depuis(&dossier_exercices())
}

pub fn charger_depuis(dossier: &Path) -> Result<Catalogue, String> {
    let texte = lire(&dossier.join("modules.toml"))?;
    let modules = toml::from_str::<FichierModules>(&texte)
        .map_err(|e| format!("modules.toml : {e}"))?
        .modules;

    // Tous les .toml sauf modules.toml, triés par nom : 01-…, 02-…
    let mut chemins: Vec<PathBuf> = fs::read_dir(dossier)
        .map_err(|e| format!("{} : {e}", dossier.display()))?
        .filter_map(|entree| entree.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|ext| ext == "toml"))
        .filter(|p| p.file_name().is_some_and(|nom| nom != "modules.toml"))
        .collect();
    chemins.sort();

    let mut exercices = Vec::new();
    for chemin in chemins {
        let nom = chemin.file_name().unwrap().to_string_lossy().to_string();
        let exercice: Exercice = toml::from_str(&lire(&chemin)?).map_err(|e| format!("{nom} : {e}"))?;
        valider(&exercice).map_err(|e| format!("{nom} : {e}"))?;
        exercices.push(exercice);
    }

    // Les exercices suivent l'ordre des modules, puis l'ordre des fichiers.
    exercices.sort_by_key(|ex| modules.iter().position(|m| m.id == ex.module).unwrap_or(usize::MAX));

    Ok(Catalogue { modules, exercices })
}

/// Vérifie qu'un exercice est cohérent avant de l'afficher.
/// Renvoie Ok(()) si tout va bien, sinon Err("ce qui ne va pas").
/// Les 12 visages de Kael : une humeur inconnue dans un TOML est refusée tout de suite.
const HUMEURS: [&str; 12] = [
    "neutre", "sur-de-lui", "sourire-en-coin", "amuse", "heureux", "sceptique",
    "agace", "colere", "gene", "inquiet", "determine", "surpris",
];

pub fn valider(exercice: &Exercice) -> Result<(), String> {
    if let Some(humeur) = &exercice.humeur {
        if !HUMEURS.contains(&humeur.as_str()) {
            return Err(format!("humeur inconnue « {humeur} » (choix : {})", HUMEURS.join(", ")));
        }
    }
    if exercice.r#type == TypeExercice::LisErreur {
        if exercice.code_casse.is_none() {
            return Err("un exercice « lis-erreur » doit avoir un code_casse".to_string());
        }
        if exercice.erreur.is_none() {
            return Err("un exercice « lis-erreur » doit avoir une erreur".to_string());
        }
        if exercice.erreur_corrigee.is_none() {
            return Err("un exercice « lis-erreur » doit avoir une erreur_corrigee".to_string());
        }
    }
    Ok(())
}

// Le banc d'essai : `cargo test` dans src-tauri/.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn le_catalogue_se_charge() {
        let catalogue = charger_depuis(&dossier_exercices()).expect("catalogue illisible");
        assert!(!catalogue.exercices.is_empty());
        for ex in &catalogue.exercices {
            assert!(
                catalogue.modules.iter().any(|m| m.id == ex.module),
                "{} : module inconnu « {} »",
                ex.id,
                ex.module
            );
        }
    }
}
