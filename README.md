# OxydeForge

Apprendre le Rust en forgeant : chaque exercice démarre avec un **éditeur vide**.
L'app est elle-même écrite en Rust, avec **Tauri**.

## Lancer

Double-clique sur `OxydeForge.bat`, ou :

```bash
npm install
npm run app
```

`npm run app` compile le Rust (`src-tauri/`) puis ouvre la fenêtre.
`npm run dev` ouvre seulement l'interface dans un navigateur, sans Rust (aperçu).

## Exécuter est lent (10 secondes) ?

`rustc` compile en 0,2 s. C'est l'**antivirus** qui inspecte chaque nouveau programme avant de le lancer.
Solution : exclure le dossier de travail d'OxydeForge dans l'antivirus :

```text
%TEMP%\oxydeforge
```

## Raccourcis de l'éditeur

| Touche | Action |
| --- | --- |
| `Ctrl + Entrée` | Exécuter |
| `Ctrl + Maj + Entrée` | Vérifier |
| `Tab` | Indenter |
| `Ctrl + /` | Commenter |
| `Ctrl + F` | Rechercher |

## Structure

| Dossier | Rôle | Langage |
| --- | --- | --- |
| `exercices/` | Les exercices, **un fichier TOML chacun**, et `modules.toml` | TOML |
| `src-tauri/src/lib.rs` | Le point de départ de l'app | Rust |
| `src-tauri/src/exercices.rs` | Lit et vérifie les fichiers TOML | Rust |
| `src-tauri/Cargo.toml` | Les dépendances Rust (crates) | TOML |
| `src-tauri/tauri.conf.json` | La fenêtre, les icônes | JSON |
| `src/` | L'interface : menu, énoncé, éditeur | TypeScript + React |
| `src/editor/` | CodeMirror réglé pour Rust | TypeScript |

**Le chemin d'un exercice** : `exercices/*.toml` → lu par `exercices.rs` (serde) → envoyé par la commande
`charger_catalogue` → affiché par `src/App.tsx`.

## Ajouter un exercice

Crée un fichier dans `exercices/` (copie un existant), puis :

```bash
cd src-tauri
cargo test
```

Le banc d'essai vérifie que tous les exercices se chargent.
