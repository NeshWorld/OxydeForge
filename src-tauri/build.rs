// Lancé par cargo AVANT la compilation de l'app : Tauri y prépare
// la configuration (tauri.conf.json) et les icônes.
fn main() {
    tauri_build::build()
}
