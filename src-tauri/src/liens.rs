// Ouvrir une page web dans le navigateur de l'utilisateur.
//
// La fenêtre Tauri ne sait pas ouvrir un lien externe toute seule : un clic sur
// <a href="https://…"> resterait sans effet. C'est donc le Rust qui demande à
// système d'ouvrir l'adresse dans le navigateur par défaut :
//   Windows → `explorer <url>`, macOS → `open <url>`, Linux → `xdg-open <url>`.
//
// Sécurité : l'interface ne choisit pas l'adresse. Elle donne un NOM ("std"),
// et seul ce fichier connaît les vraies URL. Personne ne peut donc faire ouvrir
// n'importe quoi à l'app.

use std::process::Command;

const LIENS: [(&str, &str); 1] = [("std", "https://doc.rust-lang.org/std/index.html")];

// Le programme qui ouvre une adresse, choisi à la compilation selon le système.
#[cfg(windows)]
const OUVREUR: &str = "explorer";
#[cfg(target_os = "macos")]
const OUVREUR: &str = "open";
#[cfg(not(any(windows, target_os = "macos")))]
const OUVREUR: &str = "xdg-open";

#[tauri::command]
pub fn ouvrir_lien(nom: String) -> Result<(), String> {
    let (_, url) = LIENS
        .iter()
        .find(|(cle, _)| *cle == nom)
        .ok_or_else(|| format!("lien inconnu : {nom}"))?;
    Command::new(OUVREUR)
        .arg(url)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("impossible d'ouvrir le navigateur : {e}"))
}
