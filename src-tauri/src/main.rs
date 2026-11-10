// En version finale (release), pas de console noire à côté de la fenêtre.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    oxydeforge_lib::run()
}
