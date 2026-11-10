// Le cœur d'OxydeForge.
//
// L'interface (le dossier src/, en TypeScript) ne lit jamais les fichiers elle-même :
// elle demande au Rust via des « commandes ». Chaque commande est une fonction
// marquée #[tauri::command], enregistrée ci-dessous dans generate_handler!.

mod compilation;
mod exercices;
mod liens;
mod progression;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            exercices::charger_catalogue,
            compilation::executer,
            compilation::verifier,
            liens::ouvrir_lien,
            progression::lire_progression,
            progression::ecrire_progression,
        ])
        .run(tauri::generate_context!())
        .expect("OxydeForge n'a pas pu démarrer");
}
