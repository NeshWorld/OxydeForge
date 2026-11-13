<p align="center">
  <img src="src/assets/kael/heureux.png" width="170" alt="Kael, technicien de la fonderie">
</p>

<h1 align="center">OxydeForge</h1>

<p align="center">
  <b>Apprendre le Rust en forgeant.</b><br>
  Une app écrite en Rust, pour apprendre le Rust.<br>
  105 exercices · un éditeur vide · le vrai compilateur
</p>

---

<img align="left" width="110" src="src/assets/kael/surpris.png" alt="Kael, surpris">

**Oh ! Un visiteur ! Salut, moi c'est Kael.**

Je suis technicien à la fonderie. Ici, on remet les machines en marche… en écrivant du **Rust**. Chaque exercice, c'est un bon de travail. Je te les donne, toi tu forges le code, et le compilateur vérifie. Moi, je tiens la presse. Et parfois ma clé à molette tombe. Sur mon pied.

<br clear="left">

---

## 🔥 Ce qu'il y a dans la forge

<img align="left" width="110" src="src/assets/kael/sur-de-lui.png" alt="Kael, sûr de lui">

**Trois règles de la maison, affichées sur la porte de l'atelier :**

1. **L'éditeur est vide.** Pas de texte à trous : tu écris tout toi-même.
2. **C'est le vrai `rustc` qui juge.** Ton code est compilé et lancé pour de vrai. On regarde ce qu'il **fait**, jamais comment il est écrit.
3. **Le compilateur est ton meilleur collègue.** Il a l'air sévère, mais il te dit toujours ce qui cloche.

<br clear="left">

| Chapitre | Exercices | Ce qu'on y forge |
|---|:---:|---|
| **Les bases** | 14 | `fn main`, variables, types, `if`, boucles, `match`, textes |
| **Entraînement** | 46 | remettre la main dedans, notion par notion |
| **Possession et emprunt** | 27 | l'ownership, le cœur de Rust : *move*, `clone`, `&`, `&mut`, tranches |
| **Lis l'erreur** | 6 | un code cassé, son erreur `E0xxx` : comprendre, puis réparer |
| **Défis** | 6 | un énoncé, pas de filet |
| **Le chiffre de César** | 6 | un vrai petit projet, étape par étape |

---

## 🧰 Avant d'allumer la forge

<img align="left" width="110" src="src/assets/kael/inquiet.png" alt="Kael, inquiet">

**Attends, attends ! Ne touche pas au levier tout de suite.**

La dernière fois que quelqu'un a lancé la forge sans les bons outils, on a passé l'après-midi à éponger. Il te faut **Rust** et **Node.js**, plus un petit outil selon ton système :

<br clear="left">

| Outil | Pourquoi | Pour vérifier |
|---|---|---|
| **Rust** | compiler l'app **et** tes exercices | `rustc --version` |
| **Node.js** (LTS) | faire tourner l'interface | `node --version` |
| **Git** | télécharger la forge | `git --version` |

<details open>
<summary><b>🪟 Windows</b></summary>

1. Installe **Rust** avec [rustup.rs](https://rustup.rs). Il te proposera les **outils de compilation C++ de Microsoft** : accepte, Rust en a besoin.
2. Installe **Node.js** (version LTS) depuis [nodejs.org](https://nodejs.org).
3. **WebView2**, la fenêtre de l'app, est déjà présent sur Windows 10 et 11.

</details>

<details>
<summary><b>🍎 macOS</b></summary>

1. Les outils de compilation d'Apple :
   ```bash
   xcode-select --install
   ```
2. **Rust** :
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **Node.js** (LTS) depuis [nodejs.org](https://nodejs.org), ou avec Homebrew : `brew install node`.

</details>

<details>
<summary><b>🐧 Linux</b> (Debian, Ubuntu, Mint…)</summary>

1. Les bibliothèques dont la fenêtre a besoin :
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
   ```
   Fedora, Arch… : la liste pour ta distribution est dans le [guide de Tauri](https://v2.tauri.app/start/prerequisites/#linux).
2. **Rust** :
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **Node.js** (LTS) depuis [nodejs.org](https://nodejs.org) ou le gestionnaire de paquets de ta distribution.

</details>

> Après avoir installé Rust, **ferme et rouvre ton terminal** : sinon il ne trouvera pas `rustc`.

---

## ⚙️ Allumer la forge

<img align="left" width="110" src="src/assets/kael/determine.png" alt="Kael, déterminé">

**Bon. Tout est là ? Alors on y va !**

D'abord, télécharge la forge :

<br clear="left">

```bash
git clone https://github.com/NeshWorld/OxydeForge.git
cd OxydeForge
```

Puis allume-la :

| Système | Le plus simple | Ce qu'il fait |
|---|---|---|
| 🪟 Windows | double-clique sur **`OxydeForge.bat`** | installe ce qu'il faut au premier lancement, puis ouvre l'app |
| 🍎 macOS · 🐧 Linux | `./OxydeForge.sh` dans le terminal | pareil |

Ou à la main, sur tous les systèmes :

```bash
npm install
npm run app
```

> ⏳ **Le premier lancement prend quelques minutes** : Rust compile l'app entière. Les suivants démarrent en quelques secondes.

| Commande | Ce qu'elle fait |
|---|---|
| `npm run app` | compile le Rust (`src-tauri/`) et ouvre la fenêtre |
| `npm run dev` | ouvre seulement l'interface dans un navigateur, **sans compilation** (pour un aperçu) |

---

## 🐢 « Exécuter » met 10 secondes ?

<img align="left" width="110" src="src/assets/kael/gene.png" alt="Kael, gêné">

**Euh… ce n'est pas moi, promis.**

`rustc` compile en 0,2 seconde. C'est l'**antivirus** qui inspecte chaque nouveau programme avant de le laisser partir. Surtout sous **Windows**. Pour aller plus vite, exclus le dossier de travail d'OxydeForge dans ton antivirus :

<br clear="left">

```text
%TEMP%\oxydeforge
```

Sous macOS et Linux, c'est le dossier `oxydeforge` du répertoire temporaire (`$TMPDIR` ou `/tmp`).

---

## ⌨️ Les raccourcis de l'atelier

<img align="left" width="110" src="src/assets/kael/sourire-en-coin.png" alt="Kael, sourire en coin">

**Un vrai forgeron ne lâche pas son clavier pour attraper la souris.**

Moi si. Mais toi, tu vaux mieux que ça.

<br clear="left">

Sur Mac, remplace **`Ctrl`** par **`Cmd`**.

| Touche | Action |
|---|---|
| `Ctrl + Entrée` | Exécuter |
| `Ctrl + Maj + Entrée` | Vérifier (et passer à l'exercice suivant après une réussite) |
| `Ctrl + B` | Replier ou déplier le menu |
| `Tab` | Indenter |
| `Ctrl + /` | Commenter |
| `Ctrl + F` | Rechercher |

---

## 🔩 Sous le capot

<img align="left" width="110" src="src/assets/kael/amuse.png" alt="Kael, amusé">

**Le secret de la maison :** OxydeForge est lui-même écrit en Rust, avec **Tauri**. Tu apprends le Rust… dans une machine en Rust. Un jour, tu pourras même la réparer toi-même.

<br clear="left">

| Dossier | Rôle | Langage |
|---|---|---|
| `exercices/` | les exercices, **un fichier TOML chacun**, et `modules.toml` | TOML |
| `src-tauri/src/exercices.rs` | lit et vérifie les fichiers TOML | Rust |
| `src-tauri/src/compilation.rs` | compile ton code avec `rustc`, le lance, le juge | Rust |
| `src-tauri/src/progression.rs` | garde ta progression dans un fichier | Rust |
| `src/` | l'interface : menu, énoncé, éditeur | TypeScript + React |
| `src/editor/` | CodeMirror, réglé pour Rust | TypeScript |
| `scripts/` | les générateurs d'exercices | JavaScript |

**Le trajet d'un exercice** : `exercices/*.toml` → lu par `exercices.rs` (serde) → envoyé par la commande `charger_catalogue` → affiché par `src/App.tsx`.

---

## ➕ Ajouter un exercice

<img align="left" width="110" src="src/assets/kael/heureux.png" alt="Kael, heureux">

**Tu veux ajouter ta propre machine à l'atelier ? J'adore !**

Copie un fichier de `exercices/`, modifie-le, puis lance le banc d'essai. Il vérifie que tous les exercices se chargent.

<br clear="left">

```bash
cd src-tauri
cargo test
```

> La plupart des exercices sont fabriqués par les scripts de `scripts/` : chaque solution y est **compilée et lancée**, et sa vraie sortie devient la sortie attendue. Modifie le générateur, pas le fichier TOML.

---

<p align="center">
  <img src="src/assets/kael/sur-de-lui.png" width="90" alt="Kael"><br>
  <i>« Allez, la forge est chaude. À toi de taper. »</i><br>
  <sub>Testé sous Windows. macOS et Linux : prévus, pas encore testés. Un souci ? Ouvre une <a href="https://github.com/NeshWorld/OxydeForge/issues">issue</a>.</sub>
</p>
