// Génère le chapitre « Possession et emprunt » (exercices/own-*.toml).
//
// Trois sortes d'exercices :
//   lecon      → un vrai cours (lignes de markdown) + une mission
//   lis-erreur → le code cassé est COMPILÉ : il doit échouer avec le bon code (E0382…),
//                et le vrai message de rustc devient l'erreur affichée
//   defi       → des rappels courts + une mission
// Dans tous les cas, la solution est compilée avec -D warnings puis lancée :
// sa vraie sortie devient la sortie attendue.
//
// Usage (depuis la racine du projet) : node scripts/generer_ownership.mjs
// L'exercice own-01 (la démo pile/tas) est écrit à la main : il n'est pas généré ici.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const L = (...lignes) => lignes.join('\n');

const EXERCICES = [
  // ═════════════ Étage 1 : la possession ═════════════
  {
    n: 2,
    slug: 'trois-regles',
    type: 'lecon',
    titre: 'Les trois règles',
    notion: 'propriétaire et portée',
    kael: 'Le patron a affiché trois règles sur la porte de la réserve. Je les ai lues trois fois. Je crois que j’en ai compris deux. Tu m’expliques la troisième ?',
    lecon: L(
      'Rust ne range pas la mémoire comme Python. Il suit **trois règles**, vérifiées à la compilation :',
      '',
      '| # | Règle |',
      '|---|---|',
      '| 1 | Chaque valeur a **un propriétaire** : la variable qui la contient |',
      '| 2 | Il n’y a **qu’un seul** propriétaire à la fois |',
      '| 3 | Quand le propriétaire sort de sa portée (la `}`), la valeur est **libérée** |',
      '',
      '```rust',
      'fn main() {',
      '    {',
      '        let atelier = String::from("Fonderie");   // atelier possède la String',
      '        println!("{atelier}");',
      '    }   // ← fin de la portée : la String est libérée, ici, automatiquement',
      '}',
      '```',
      '',
      '> En Python, un **ramasse-miettes** passe de temps en temps pour libérer ce qui ne sert plus. Rust n’en a pas besoin : il sait **exactement** où chaque valeur meurt, grâce à la règle 3.',
      '',
      'Pas de ramasse-miettes, pas d’oubli de libération comme en C : c’est ce qui rend Rust à la fois **rapide** et **sûr**.',
    ),
    mission: 'Dans un bloc `{ }`, crée une `String` « Fonderie » et affiche qu’elle ouvre. Après le bloc, affiche que l’atelier a fermé.',
    indices: ['La `String` vit dans le bloc : `{ let atelier = String::from("Fonderie"); println!(…); }`', 'Après la `}`, `atelier` n’existe plus : écris juste le message de fermeture.'],
    solution: `fn main() {
    {
        let atelier = String::from("Fonderie");
        println!("{atelier} : ouverture");
    }
    println!("L'atelier a fermé, sa String est libérée");
}`,
  },
  {
    n: 3,
    slug: 'copie-deplacement',
    type: 'lecon',
    titre: 'Copie ou déménagement ?',
    notion: 'Copy contre move',
    kael: 'Quand je prête ma clé de 12, je n’en ai plus. Quand je donne le numéro de la clé, j’ai encore la clé. C’est pareil en Rust, paraît-il.',
    lecon: L(
      'Que se passe-t-il avec `let b = a;` ? **Ça dépend du type.**',
      '',
      '**Les petits types sont copiés** : nombres, `bool`, `char`.',
      '',
      '```rust',
      'let a = 5;',
      'let b = a;      // b reçoit une COPIE de 5',
      'println!("{a} {b}");   // ✅ les deux existent',
      '```',
      '',
      '**Les `String` déménagent** : la valeur change de propriétaire.',
      '',
      '```rust',
      'let s1 = String::from("Ferris");',
      'let s2 = s1;    // la String DÉMÉNAGE dans s2',
      'println!("{s2}");      // ✅',
      '// println!("{s1}");   // ❌ E0382 : s1 est vide',
      '```',
      '',
      '| Type | `let b = a;` | Pourquoi |',
      '|---|---|---|',
      '| `i32`, `f64`, `bool`, `char` | **copie** | minuscule, copier ne coûte rien |',
      '| `String` | **déménagement** (*move*) | le texte peut être énorme : on ne le recopie pas en douce |',
      '',
      '> Les types copiables ont un nom en Rust : ils implémentent `Copy`. C’est le `does not implement the Copy trait` des messages d’erreur.',
    ),
    mission: 'Copie un `i32` et affiche les deux variables. Puis fais déménager une `String` « Ferris » vers `nouveau` et affiche le nouveau propriétaire.',
    indices: ['`let a = 7; let b = a;` puis les deux dans un `println!`.', 'Après `let nouveau = ancien;`, n’utilise **que** `nouveau`.'],
    solution: `fn main() {
    let a = 7;
    let b = a;
    println!("Copie : a = {a}, b = {b}");

    let ancien = String::from("Ferris");
    let nouveau = ancien;
    println!("Déménagement : {nouveau} a un nouveau propriétaire");
}`,
  },
  {
    n: 4,
    slug: 'e0382-fonction',
    type: 'lis-erreur',
    titre: 'Donnée à une fonction',
    notion: 'move dans une fonction et E0382',
    code: 'E0382',
    kael: 'Panne ! J’ai donné la plaque de Ferris à la graveuse… et je ne la retrouve plus. La graveuse l’a gardée ? Elle ne rend jamais rien, celle-là.',
    humeur: 'gene',
    lecon: L(
      'Donner une `String` à une fonction, c’est comme `let b = a;` : la `String` **déménage** dans le paramètre.',
      '',
      '```rust',
      'fn graver(texte: String) { … }   // texte devient le propriétaire',
      '',
      'graver(nom);    // nom déménage dans texte…',
      '                // …et à la fin de graver, la String est libérée !',
      '```',
      '',
      'Après l’appel, `nom` est vide : l’utiliser donne l’erreur **E0382**.',
      '',
      '**Pour l’instant**, la solution est `.clone()` : on donne une **copie**, et on garde l’original. (À l’étage suivant, tu verras bien mieux : le **prêt**.)',
      '',
      '**Lire l’erreur** :',
      '- `value moved here` : **où** la `String` est partie (l’appel à `graver`)',
      '- `value borrowed here after move` : où tu essaies de t’en servir après',
      '- `note: consider changing this parameter type…` : rustc suggère déjà le prêt !',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le corrigé avec `.clone()`.',
    code_casse: `fn graver(texte: String) {
    println!("Gravé : {texte}");
}

fn main() {
    let nom = String::from("Ferris");
    graver(nom);
    println!("Nom gardé : {nom}");
}`,
    indices: ['`graver(nom.clone());` : la graveuse reçoit une copie.'],
    solution: `fn graver(texte: String) {
    println!("Gravé : {texte}");
}

fn main() {
    let nom = String::from("Ferris");
    graver(nom.clone());
    println!("Nom gardé : {nom}");
}`,
  },
  {
    n: 5,
    slug: 'rendre-propriete',
    type: 'lecon',
    titre: 'Rendre la propriété',
    notion: 'fonction qui renvoie une String',
    kael: 'Le plan de la presse doit passer chez le patron pour signature, puis me revenir. La dernière fois, il ne me l’a jamais rendu. Il l’a encadré.',
    lecon: L(
      'Une fonction peut **prendre** une `String`… et la **rendre** à la fin, en la renvoyant.',
      '',
      '```rust',
      'fn signer(mut plan: String) -> String {',
      '    plan.push_str(" (signé)");',
      '    plan    // la String repart vers l’appelant',
      '}',
      '',
      'let plan = String::from("Plan");',
      'let plan = signer(plan);   // elle part… et revient (masquage !)',
      '```',
      '',
      '| Écriture | Sens |',
      '|---|---|',
      '| `mut plan: String` | la fonction devient propriétaire, **et** peut modifier |',
      '| `-> String` | la propriété est **rendue** à l’appelant |',
      '',
      '> Ça marche, mais c’est lourd : prendre puis rendre à chaque fois… Garde ça en tête, l’étage 2 a une solution plus élégante.',
    ),
    mission: 'Écris `signer(mut plan: String) -> String` qui ajoute « - signé par Kael ». Fais passer « Plan de la presse » dedans, puis affiche le résultat.',
    indices: ['`plan.push_str(" - signé par Kael");` puis `plan` sans point-virgule.', 'Dans `main` : `let plan = signer(plan);`'],
    solution: `fn signer(mut plan: String) -> String {
    plan.push_str(" - signé par Kael");
    plan
}

fn main() {
    let plan = String::from("Plan de la presse");
    let plan = signer(plan);
    println!("{plan}");
}`,
  },
  {
    n: 6,
    slug: 'clone',
    type: 'lecon',
    titre: 'Cloner, et ce que ça coûte',
    notion: '.clone()',
    kael: 'J’ai photocopié le grand plan de la fonderie, juste au cas où. 400 pages. La photocopieuse a fondu. Il paraît qu’il faut cloner avec modération.',
    lecon: L(
      '`.clone()` fabrique une **vraie copie**, complète et indépendante.',
      '',
      '```rust',
      'let original = String::from("Modèle");',
      'let mut copie = original.clone();',
      'copie.push_str(" bis");   // on modifie la copie…',
      '// …l’original n’a pas bougé',
      '```',
      '',
      '**Le prix** : cloner une `String`, c’est recopier **tout** son texte en mémoire. Avec un texte de 10 lettres, rien. Avec un fichier entier, c’est lent.',
      '',
      '| Quand cloner | Quand éviter |',
      '|---|---|',
      '| tu as vraiment besoin de **deux** versions indépendantes | juste pour faire taire E0382 sans réfléchir |',
      '',
      '> En Rust, chaque `.clone()` se **voit** dans le code. C’est voulu : les copies coûteuses ne se cachent jamais.',
    ),
    mission: 'Clone « Modèle » dans une copie modifiable, ajoute « (copie) » à la copie seulement, puis affiche les deux.',
    indices: ['`let mut copie = original.clone();`'],
    solution: `fn main() {
    let original = String::from("Modèle");
    let mut copie = original.clone();
    copie.push_str(" (copie)");
    println!("Original : {original}");
    println!("Copie : {copie}");
}`,
  },
  {
    n: 7,
    slug: 'prendre-rendre',
    type: 'defi',
    titre: 'Mesurer sans perdre',
    notion: 'prendre et rendre avec un tuple',
    kael: 'Je veux mesurer la longueur d’une étiquette. Mais si je la donne à la machine à mesurer, elle la garde ! Il faut qu’elle me la rende, avec la mesure.',
    rappels: [
      'une fonction peut renvoyer **plusieurs** valeurs dans un tuple : `-> (String, usize)`',
      '`usize` : le type des tailles et des positions (ce que renvoie `.len()`)',
      'on récupère tout avec une déstructuration : `let (etiquette, taille) = mesurer(etiquette);`',
    ],
    mission: 'Écris `mesurer(s: String) -> (String, usize)` qui rend la `String` **et** sa longueur. Mesure « OxydeForge », puis affiche l’étiquette et sa taille.',
    indices: ['`let n = s.len(); (s, n)`', 'Remarque comme c’est lourd : c’est exactement ce que le prêt `&` va simplifier.'],
    solution: `fn mesurer(s: String) -> (String, usize) {
    let n = s.len();
    (s, n)
}

fn main() {
    let etiquette = String::from("OxydeForge");
    let (etiquette, taille) = mesurer(etiquette);
    println!("{etiquette} : {taille} octets");
}`,
  },
  {
    n: 8,
    slug: 'badges',
    type: 'defi',
    titre: 'L’atelier des badges',
    notion: 'String dans une boucle et format!',
    kael: 'Il faut des badges pour tout le monde : nom en majuscules, entre crochets. Le mien est écrit « KEAL ». Ça fait trois semaines que je le porte.',
    rappels: [
      '`String::from(nom)` crée une `String` à partir d’un texte fixe',
      'la fonction **prend** la `String` et en **renvoie** une nouvelle',
      '`format!("[{}]", nom.to_uppercase())` construit le badge',
    ],
    mission: 'Écris `fabriquer_badge(nom: String) -> String`. Pour « Ferris », « Kael » et « Rusty », fabrique et affiche le badge.',
    indices: ['`for nom in ["Ferris", "Kael", "Rusty"] { let badge = fabriquer_badge(String::from(nom)); … }`'],
    solution: `fn fabriquer_badge(nom: String) -> String {
    format!("[{}]", nom.to_uppercase())
}

fn main() {
    for nom in ["Ferris", "Kael", "Rusty"] {
        let badge = fabriquer_badge(String::from(nom));
        println!("{badge}");
    }
}`,
  },

  // ═════════════ Étage 2 : l'emprunt ═════════════
  {
    n: 9,
    slug: 'emprunt',
    type: 'lecon',
    titre: 'Prêter sans donner : &',
    notion: 'les références',
    kael: 'Le voisin m’a demandé ma clé de 12. Je la lui ai PRÊTÉE. Il me l’a rendue ! Ça m’a tellement ému que j’ai pleuré un peu. Un tout petit peu.',
    lecon: L(
      'Au lieu de **donner** une `String`, on peut la **prêter** avec `&`.',
      '',
      '```rust',
      'fn longueur(s: &String) -> usize {   // s est une RÉFÉRENCE : un prêt',
      '    s.len()',
      '}   // fin du prêt : rien n’est libéré, la String n’appartient pas à s',
      '',
      'let nom = String::from("Ferris");',
      'let n = longueur(&nom);   // on prête nom…',
      'println!("{nom}");         // ✅ …et on l’a toujours !',
      '```',
      '',
      '| Écriture | Sens |',
      '|---|---|',
      '| `fn f(s: String)` | « donne-la moi » : elle déménage |',
      '| `fn f(s: &String)` | « prête-la moi » : tu la gardes |',
      '| `f(&nom)` | on prête `nom` |',
      '',
      'Emprunter s’appelle *borrowing* en anglais : c’est le fameux **borrow checker**, le vérificateur de prêts de rustc.',
      '',
      '> Compare avec l’exercice « Mesurer sans perdre » : plus besoin de rendre la `String` dans un tuple !',
    ),
    mission: 'Écris `longueur(s: &String) -> usize`. Prête-lui « Ferris », affiche sa longueur, puis affiche encore le nom pour prouver que tu l’as gardé.',
    indices: ['L’appel : `longueur(&nom)`, avec le `&`.'],
    solution: `fn longueur(s: &String) -> usize {
    s.len()
}

fn main() {
    let nom = String::from("Ferris");
    let n = longueur(&nom);
    println!("{nom} : {n} lettres");
    println!("Toujours à moi : {nom}");
}`,
  },
  {
    n: 10,
    slug: 'str-parametre',
    type: 'lecon',
    titre: '&str : le meilleur paramètre texte',
    notion: '&str accepte tout',
    kael: 'La machine à saluer n’accepte que les noms sur plaque en métal. Pas les noms écrits à la craie. C’est trop compliqué ! Il faut qu’elle accepte tout.',
    lecon: L(
      'Pour une fonction qui **lit** du texte, l’habitude est `&str`, pas `&String`.',
      '',
      '```rust',
      'fn saluer(nom: &str) {',
      '    println!("Bonjour, {nom} !");',
      '}',
      '',
      'let ferris = String::from("Ferris");',
      'saluer(&ferris);   // ✅ une String prêtée',
      'saluer("Kael");    // ✅ un texte fixe',
      '```',
      '',
      '| Paramètre | Accepte une `String` prêtée | Accepte un texte fixe `"…"` |',
      '|---|---|---|',
      '| `&String` | ✅ | ❌ |',
      '| `&str` | ✅ (Rust convertit tout seul) | ✅ |',
      '',
      '> `&str` est une **vue** sur du texte, où qu’il soit : dans une `String` ou écrit en dur dans le programme. C’est pour ça qu’il accepte tout.',
    ),
    mission: 'Écris `saluer(nom: &str)`. Appelle-la avec une `String` prêtée (« Ferris »), puis avec le texte fixe « Kael ».',
    indices: ['`saluer(&ferris);` puis `saluer("Kael");`'],
    solution: `fn saluer(nom: &str) {
    println!("Bonjour, {nom} !");
}

fn main() {
    let ferris = String::from("Ferris");
    saluer(&ferris);
    saluer("Kael");
}`,
  },
  {
    n: 11,
    slug: 'emprunt-mutable',
    type: 'lecon',
    titre: 'Prêter pour modifier : &mut',
    notion: 'les références mutables',
    kael: 'J’ai prêté mon carnet à l’apprenti pour qu’il ajoute une note. Il a ajouté un dessin de moi. Pas très ressemblant. Enfin… un peu.',
    lecon: L(
      'Un prêt `&` permet seulement de **lire**. Pour **modifier**, il faut un prêt **mutable** : `&mut`.',
      '',
      '```rust',
      'fn crier(s: &mut String) {',
      '    s.push(\'!\');',
      '}',
      '',
      'let mut cri = String::from("Ca tourne");   // ① la variable doit être mut',
      'crier(&mut cri);                             // ② on prête avec &mut',
      'println!("{cri}");                           // Ca tourne!',
      '```',
      '',
      '**Trois** `mut` à ne pas oublier :',
      '',
      '| Où | Pourquoi |',
      '|---|---|',
      '| `let mut cri` | la variable elle-même doit être modifiable |',
      '| `s: &mut String` | la fonction annonce qu’elle va modifier |',
      '| `crier(&mut cri)` | l’appel le dit aussi : on **voit** qui modifie quoi |',
      '',
      '> Le `&mut` à l’appel est précieux : en lisant `crier(&mut cri)`, tu sais tout de suite que `cri` peut changer.',
    ),
    mission: 'Écris `crier(s: &mut String)` qui ajoute « ! ». Appelle-la deux fois sur « Ca tourne », puis affiche le résultat.',
    indices: ['`let mut cri = …;` puis deux fois `crier(&mut cri);`'],
    solution: `fn crier(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut cri = String::from("Ca tourne");
    crier(&mut cri);
    crier(&mut cri);
    println!("{cri}");
}`,
  },
  {
    n: 12,
    slug: 'e0596-pas-mut',
    type: 'lis-erreur',
    titre: 'Prêter ce qui ne bouge pas',
    notion: '&mut sur une variable sans mut, E0596',
    code: 'E0596',
    kael: 'Panne ! La machine à crier refuse de travailler. Elle dit que le cri est « figé ». Figé ? C’est moi qui l’ai fabriqué, ce cri, il est très bien !',
    lecon: L(
      'Pour prêter avec `&mut`, la variable **elle-même** doit être déclarée avec `mut`.',
      '',
      'Logique : si `cri` est immuable, personne ne peut le modifier, même en l’empruntant.',
      '',
      '**Lire l’erreur** :',
      '- `cannot borrow cri as mutable` : « impossible d’emprunter `cri` en mutable »',
      '- `help: consider changing this to be mutable` : rustc montre où ajouter `mut`, avec des `+++`',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le corrigé.',
    code_casse: `fn crier(s: &mut String) {
    s.push('!');
}

fn main() {
    let cri = String::from("Ca tourne");
    crier(&mut cri);
    println!("{cri}");
}`,
    indices: ['Un seul mot à ajouter, à la ligne du `let`.'],
    solution: `fn crier(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut cri = String::from("Ca tourne");
    crier(&mut cri);
    println!("{cri}");
}`,
  },
  {
    n: 13,
    slug: 'e0499-deux-mut',
    type: 'lis-erreur',
    titre: 'Deux écrivains à la fois',
    notion: 'deux &mut en même temps, E0499',
    code: 'E0499',
    kael: 'Panne ! Deux apprentis ont voulu écrire sur la même plaque EN MÊME TEMPS. Résultat : illisible. Le compilateur a crié avant moi, pour une fois.',
    lecon: L(
      'Rust interdit **deux** prêts mutables de la même valeur **en même temps**.',
      '',
      '**Pourquoi ?** Si deux parties du code modifient la même chose en même temps, le résultat dépend de qui passe en premier : c’est un des pires bugs qui existent (une *data race*). Rust le rend **impossible**.',
      '',
      '**Un prêt dure** jusqu’à sa **dernière utilisation**. Il suffit donc de finir avec le premier écrivain avant de commencer avec le second.',
      '',
      '**Lire l’erreur** :',
      '- `first mutable borrow occurs here` : le premier prêt',
      '- `second mutable borrow occurs here` : le second, pendant que le premier sert encore',
      '- `first borrow later used here` : la preuve que le premier n’était pas fini',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le pour que les deux prêts se suivent au lieu de se chevaucher.',
    code_casse: `fn main() {
    let mut plaque = String::from("forge");
    let a = &mut plaque;
    let b = &mut plaque;
    a.push('!');
    b.push('?');
    println!("{plaque}");
}`,
    indices: ['Utilise `a` **avant** de créer `b` : `let a = &mut plaque; a.push(\'!\');` puis `let b = …`'],
    solution: `fn main() {
    let mut plaque = String::from("forge");
    let a = &mut plaque;
    a.push('!');
    let b = &mut plaque;
    b.push('?');
    println!("{plaque}");
}`,
  },
  {
    n: 14,
    slug: 'e0502-lire-ecrire',
    type: 'lis-erreur',
    titre: 'Lire pendant qu’on écrit',
    notion: '& et &mut en même temps, E0502',
    code: 'E0502',
    kael: 'Panne ! J’étais en train de lire l’inventaire quand l’apprenti l’a modifié sous mon nez. J’ai compté des boulons qui n’existaient plus.',
    lecon: L(
      'Rust interdit aussi de **modifier** une valeur pendant que quelqu’un la **lit**.',
      '',
      'Logique : le lecteur croit voir une valeur… qui change sous ses yeux.',
      '',
      '```rust',
      'let lecture = &stocks;         // un lecteur commence',
      'stocks.push_str(" + 5");       // ❌ on écrit pendant qu’il lit encore…',
      'println!("{lecture}");         // …car il lit ici',
      '```',
      '',
      '**Lire l’erreur** :',
      '- `cannot borrow stocks as mutable because it is also borrowed as immutable` : on veut écrire, mais quelqu’un lit',
      '- `immutable borrow later used here` : là où le lecteur sert encore',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le : le lecteur doit **finir** avant que l’écriture commence.',
    code_casse: `fn main() {
    let mut stocks = String::from("10 boulons");
    let lecture = &stocks;
    stocks.push_str(" + 5");
    println!("Avant : {lecture}");
    println!("Après : {stocks}");
}`,
    indices: ['Déplace le `println!("Avant : …")` juste après `let lecture = &stocks;`.'],
    solution: `fn main() {
    let mut stocks = String::from("10 boulons");
    let lecture = &stocks;
    println!("Avant : {lecture}");
    stocks.push_str(" + 5");
    println!("Après : {stocks}");
}`,
  },
  {
    n: 15,
    slug: 'regle-or',
    type: 'lecon',
    titre: 'La règle d’or des prêts',
    notion: 'plusieurs lecteurs OU un écrivain',
    kael: 'Le règlement de la bibliothèque de l’atelier : on peut être plein à lire le même manuel, mais un seul à écrire dedans. Et personne ne lit pendant qu’on écrit. J’ai enfin compris !',
    humeur: 'heureux',
    lecon: L(
      'Toutes les erreurs de l’étage tiennent en **une** règle :',
      '',
      '> **Plusieurs lecteurs (`&`) OU un seul écrivain (`&mut`). Jamais les deux en même temps.**',
      '',
      '| Situation | Autorisé ? |',
      '|---|---|',
      '| `&` + `&` + `&` | ✅ autant de lecteurs qu’on veut |',
      '| un seul `&mut` | ✅ |',
      '| `&mut` + `&mut` | ❌ E0499 |',
      '| `&` + `&mut` | ❌ E0502 |',
      '',
      '**Et la durée d’un prêt ?** Il s’arrête à sa **dernière utilisation**, pas à la `}`. Donc ceci marche :',
      '',
      '```rust',
      'let r1 = &s;',
      'let r2 = &s;',
      'println!("{r1} {r2}");   // dernière utilisation des lecteurs',
      'let w = &mut s;          // ✅ les lecteurs ont fini',
      'w.push(\'!\');',
      '```',
      '',
      '> C’est exactement la règle d’un verrou en base de données : plusieurs `SELECT` en même temps, mais un `UPDATE` attend que personne ne lise.',
    ),
    mission: 'Avec `let mut s = String::from("forge");` : deux lecteurs affichent la valeur, puis un écrivain ajoute « ! », puis affiche le résultat final.',
    indices: ['Deux `&s`, un `println!` qui les utilise, puis `let w = &mut s; w.push(\'!\');`'],
    solution: `fn main() {
    let mut s = String::from("forge");
    let r1 = &s;
    let r2 = &s;
    println!("Lecteurs : {r1} et {r2}");
    let w = &mut s;
    w.push('!');
    println!("Après l'écrivain : {s}");
}`,
  },
  {
    n: 16,
    slug: 'compteur-mut',
    type: 'defi',
    titre: 'Le compteur de pièces',
    notion: '&mut i32 et *',
    kael: 'Chaque fois qu’une pièce sort de la presse, une machine doit ajouter 1 au compteur. Pas le compteur de la machine : LE compteur. Celui du mur.',
    rappels: [
      'on peut prêter un nombre en mutable : `fn ajouter(compteur: &mut i32)`',
      'pour modifier la valeur **derrière** la référence, il faut l’étoile : `*compteur += 1;`',
      '`*` se lit « la valeur pointée par »',
    ],
    mission: 'Écris `ajouter(compteur: &mut i32)`. Appelle-la 3 fois dans une boucle, puis affiche le compteur.',
    indices: ['`*compteur += 1;` dans la fonction.', 'Dans la boucle : `ajouter(&mut pieces);`'],
    solution: `fn ajouter(compteur: &mut i32) {
    *compteur += 1;
}

fn main() {
    let mut pieces = 0;
    for _ in 0..3 {
        ajouter(&mut pieces);
    }
    println!("Pièces sorties : {pieces}");
}`,
  },
  {
    n: 17,
    slug: 'voyelles-emprunt',
    type: 'defi',
    titre: 'Compter sans garder',
    notion: '&str, .chars() et match',
    kael: 'Le graveur veut compter les voyelles de chaque mot avant de graver. Mais il ne doit RIEN garder. La dernière fois, il a gardé « fonderie ». On ne l’a jamais revue.',
    rappels: [
      'la fonction **emprunte** le mot : `fn voyelles(mot: &str) -> u32`',
      '`.chars()` et `match` comme dans l’Entraînement',
      'les textes fixes `"…"` sont déjà des `&str`',
    ],
    mission: 'Écris `voyelles(mot: &str) -> u32`. Pour « fonderie », « rouage » et « Rust », affiche le nombre de voyelles (a, e, i, o, u, y, en minuscules).',
    indices: ['Le corps : un compteur, une boucle `for c in mot.chars()`, un `match`.'],
    solution: `fn voyelles(mot: &str) -> u32 {
    let mut total = 0;
    for c in mot.chars() {
        match c {
            'a' | 'e' | 'i' | 'o' | 'u' | 'y' => total += 1,
            _ => {}
        }
    }
    total
}

fn main() {
    for mot in ["fonderie", "rouage", "Rust"] {
        println!("{mot} : {} voyelles", voyelles(mot));
    }
}`,
  },
  {
    n: 18,
    slug: 'tableau-mut',
    type: 'defi',
    titre: 'Doubler la production',
    notion: '&mut sur un tableau',
    kael: 'Le patron veut doubler la production de chaque machine. Il a dit « doubler », pas « doubloner ». J’avais compris doubloner. C’est un mot ?',
    rappels: [
      'un tableau se prête aussi : `fn doubler(production: &mut [i32; 4])`',
      'dans la fonction, on modifie les cases avec leurs indices',
      '`{:?}` affiche le tableau entier',
    ],
    mission: 'Écris `doubler(production: &mut [i32; 4])`. Applique-la à `[3, 5, 2, 8]` et affiche le tableau avant et après.',
    indices: ['`for i in 0..production.len() { production[i] *= 2; }`', 'L’appel : `doubler(&mut production);`'],
    solution: `fn doubler(production: &mut [i32; 4]) {
    for i in 0..production.len() {
        production[i] *= 2;
    }
}

fn main() {
    let mut production = [3, 5, 2, 8];
    println!("Avant : {:?}", production);
    doubler(&mut production);
    println!("Après : {:?}", production);
}`,
  },

  // ═════════════ Étage 3 : les tranches et les défis ═════════════
  {
    n: 19,
    slug: 'slices-texte',
    type: 'lecon',
    titre: 'Une tranche de texte',
    notion: 'les slices &s[a..b]',
    kael: 'Il faut découper l’enseigne « OxydeForge » en deux pour la mettre sur deux portes. Sans scier le texte, s’il te plaît. J’ai déjà scié une enseigne. Le patron s’en souvient.',
    lecon: L(
      'Une **slice** (tranche) est un **prêt d’un morceau** : elle regarde une partie d’un texte, sans rien copier.',
      '',
      '```rust',
      'let s = String::from("OxydeForge");',
      'let debut = &s[0..5];   // "Oxyde" : de la position 0 à 5 (exclu)',
      'let fin = &s[5..];      // "Forge" : de 5 jusqu’au bout',
      '```',
      '',
      '| Écriture | Morceau |',
      '|---|---|',
      '| `&s[0..5]` | positions 0 à 4 |',
      '| `&s[..5]` | pareil : depuis le début |',
      '| `&s[5..]` | de 5 jusqu’à la fin |',
      '| `&s[..]` | tout |',
      '',
      'Le type d’une tranche de texte ? **`&str`** ! C’est exactement ce qu’est `&str` : une vue sur un morceau de texte.',
      '',
      '> ⚠️ Les positions comptent des **octets**. Couper au milieu d’un `é` (2 octets) fait planter le programme. Avec des lettres sans accent, aucun souci.',
      '',
      '> En Python, c’est `s[0:5]`… mais Python **copie** le morceau. Rust, lui, se contente de le **regarder**.',
    ),
    mission: 'Découpe « OxydeForge » en deux tranches (« Oxyde » et « Forge ») et affiche-les sur deux lignes.',
    indices: ['`&s[0..5]` et `&s[5..]`'],
    solution: `fn main() {
    let enseigne = String::from("OxydeForge");
    let porte_gauche = &enseigne[0..5];
    let porte_droite = &enseigne[5..];
    println!("Porte gauche : {porte_gauche}");
    println!("Porte droite : {porte_droite}");
}`,
  },
  {
    n: 20,
    slug: 'slices-tableau',
    type: 'lecon',
    titre: 'Une tranche de tableau',
    notion: '&[i32] accepte tout',
    kael: 'Je veux additionner la production de toute la semaine, mais aussi juste celle du milieu de semaine. Avec UNE seule machine à additionner. C’est possible ?',
    lecon: L(
      'Une fonction qui prend `&[i32; 5]` n’accepte **que** les tableaux de 5. Avec `&[i32]` (sans taille), elle accepte **n’importe quel** tableau, ou un morceau.',
      '',
      '```rust',
      'fn somme(valeurs: &[i32]) -> i32 {',
      '    let mut total = 0;',
      '    for v in valeurs {',
      '        total += v;',
      '    }',
      '    total',
      '}',
      '',
      'let semaine = [4, 7, 5, 9, 3];',
      'somme(&semaine);        // tout le tableau',
      'somme(&semaine[1..4]);  // une tranche : 7, 5, 9',
      '```',
      '',
      '| Paramètre | Accepte |',
      '|---|---|',
      '| `&[i32; 5]` | seulement les tableaux de 5 |',
      '| `&[i32]` | tout tableau, de toute taille, et toute tranche |',
      '',
      '> C’est le même principe qu’avec le texte : `&str` est la tranche de `String`, et `&[i32]` est la tranche de tableau.',
    ),
    mission: 'Écris `somme(valeurs: &[i32]) -> i32`. Avec `[4, 7, 5, 9, 3]`, affiche la somme de la semaine, puis celle des jours 1 à 3 (`&semaine[1..4]`).',
    indices: ['`somme(&semaine)` puis `somme(&semaine[1..4])`'],
    solution: `fn somme(valeurs: &[i32]) -> i32 {
    let mut total = 0;
    for v in valeurs {
        total += v;
    }
    total
}

fn main() {
    let semaine = [4, 7, 5, 9, 3];
    println!("Toute la semaine : {}", somme(&semaine));
    println!("Milieu de semaine : {}", somme(&semaine[1..4]));
}`,
  },
  {
    n: 21,
    slug: 'defi-maximum',
    type: 'defi',
    titre: 'Le pic de température',
    notion: 'parcourir une tranche',
    kael: 'Commande spéciale ! Le four a relevé ses températures toute la journée. Il me faut le pic du matin, et le pic de la journée entière. Et vite, ça chauffe.',
    rappels: [
      '`fn maximum(valeurs: &[i32]) -> i32` accepte le tableau entier **ou** une tranche',
      'commence avec la première valeur : `let mut max = valeurs[0];`',
      '`for &v in valeurs` récupère chaque valeur directement (le `&` « déballe » l’emprunt)',
    ],
    mission: 'Écris `maximum`. Avec `[820, 950, 1010, 990, 1180, 1050]`, affiche le pic du matin (les 3 premières) puis celui de la journée.',
    indices: ['Le matin : `maximum(&releves[..3])`', 'Dans la boucle : `if v > max { max = v; }`'],
    solution: `fn maximum(valeurs: &[i32]) -> i32 {
    let mut max = valeurs[0];
    for &v in valeurs {
        if v > max {
            max = v;
        }
    }
    max
}

fn main() {
    let releves = [820, 950, 1010, 990, 1180, 1050];
    println!("Pic du matin : {} degrés", maximum(&releves[..3]));
    println!("Pic de la journée : {} degrés", maximum(&releves));
}`,
  },
  {
    n: 22,
    slug: 'defi-inventaire',
    type: 'defi',
    titre: 'L’inventaire partagé',
    notion: '&mut et & dans le même programme',
    kael: 'Commande spéciale ! Une livraison arrive sur l’étagère 2. Il faut l’ajouter, puis faire le total de tout l’entrepôt. Sans tout recompter à la main, cette fois.',
    rappels: [
      'une fonction qui **modifie** : `fn livrer(stocks: &mut [u32], etagere: usize, quantite: u32)`',
      'une fonction qui **lit** : `fn total(stocks: &[u32]) -> u32`',
      '`usize` est le type des positions dans un tableau',
    ],
    mission: 'Avec `[12, 4, 7]` : livre 10 pièces sur l’étagère 2 (position 1), puis affiche les stocks avec `{:?}` et le total.',
    indices: ['`livrer(&mut stocks, 1, 10);`', '`total(&stocks)` : un simple prêt suffit pour lire.'],
    solution: `fn livrer(stocks: &mut [u32], etagere: usize, quantite: u32) {
    stocks[etagere] += quantite;
}

fn total(stocks: &[u32]) -> u32 {
    let mut somme = 0;
    for s in stocks {
        somme += s;
    }
    somme
}

fn main() {
    let mut stocks = [12, 4, 7];
    livrer(&mut stocks, 1, 10);
    println!("Stocks : {:?}", stocks);
    println!("Total : {}", total(&stocks));
}`,
  },
  {
    n: 23,
    slug: 'defi-rapport',
    type: 'defi',
    titre: 'Le rapport de machine',
    notion: '&str + &[u32] → String',
    kael: 'Commande spéciale ! Le patron veut un rapport par machine : son nom et sa moyenne de production. Il veut ça « propre ». J’ai fait un rapport la dernière fois. Il était propre. Mais faux.',
    rappels: [
      'la fonction **emprunte** le nom et les chiffres : `fn rapport(nom: &str, production: &[u32]) -> String`',
      'elle **fabrique** une `String` neuve avec `format!`, et la donne à l’appelant',
      'moyenne : convertir avec `as f64` avant de diviser, puis `{:.1}`',
    ],
    mission: 'Écris `rapport`. Affiche le rapport de « Presse » `[12, 15, 9]` et de « Four » `[30, 28]`.',
    indices: ['Somme dans une boucle, puis `somme as f64 / production.len() as f64`.', '`format!("{nom} : moyenne {moyenne:.1} pièces")`'],
    solution: `fn rapport(nom: &str, production: &[u32]) -> String {
    let mut somme = 0;
    for p in production {
        somme += p;
    }
    let moyenne = somme as f64 / production.len() as f64;
    format!("{nom} : moyenne {moyenne:.1} pièces")
}

fn main() {
    println!("{}", rapport("Presse", &[12, 15, 9]));
    println!("{}", rapport("Four", &[30, 28]));
}`,
  },
  {
    n: 24,
    slug: 'defi-premier-mot',
    type: 'defi',
    titre: 'Le premier mot',
    notion: 'renvoyer une tranche',
    kael: 'Commande spéciale ! Pour les étiquettes courtes, il ne faut garder que le premier mot de chaque phrase. « Kael est formidable » devient… « Kael ». Parfait, c’est le plus important.',
    humeur: 'sourire-en-coin',
    rappels: [
      'une fonction peut **renvoyer une tranche** de ce qu’on lui prête : `fn premier_mot(phrase: &str) -> &str`',
      '`.char_indices()` donne `(position, caractère)` : on cherche le premier espace',
      '`return &phrase[..i];` dès qu’on le trouve ; s’il n’y en a pas, toute la phrase est le premier mot',
    ],
    mission: 'Écris `premier_mot`. Affiche le premier mot de « Kael est formidable », « Rust » et « La forge chauffe ».',
    indices: ['`for (i, c) in phrase.char_indices() { if c == \' \' { return &phrase[..i]; } }`', 'Après la boucle : `phrase` sans point-virgule.'],
    solution: `fn premier_mot(phrase: &str) -> &str {
    for (i, c) in phrase.char_indices() {
        if c == ' ' {
            return &phrase[..i];
        }
    }
    phrase
}

fn main() {
    for phrase in ["Kael est formidable", "Rust", "La forge chauffe"] {
        println!("{phrase} -> {}", premier_mot(phrase));
    }
}`,
  },
];

// ───────────── Génération ─────────────

const atelier = mkdtempSync(join(tmpdir(), 'oxydeforge-own-'));
const dossier = new URL('../exercices/', import.meta.url);

function rustc(code, options = []) {
  writeFileSync(join(atelier, 'main.rs'), code);
  try {
    execFileSync('rustc', ['--edition', '2021', ...options, 'main.rs', '-o', 'prog.exe'], { cwd: atelier, stdio: 'pipe' });
    return { ok: true, stderr: '' };
  } catch (e) {
    return { ok: false, stderr: e.stderr.toString().replace(/\r\n/g, '\n') };
  }
}

const literal = (texte) => {
  if (texte.includes("'''")) throw new Error(`texte avec ''' : ${texte.slice(0, 40)}`);
  return `'''\n${texte.replace(/\n+$/, '')}\n'''`;
};

for (const ex of EXERCICES) {
  const numero = String(ex.n).padStart(2, '0');
  const id = `own-${numero}`;

  // 1. La solution : aucun avertissement, puis on la lance.
  const solution = rustc(ex.solution, ['-D', 'warnings']);
  if (!solution.ok) throw new Error(`${id} : la solution a un problème\n${solution.stderr}`);
  const sortie = execFileSync(join(atelier, 'prog.exe'), { encoding: 'utf8' }).replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (!sortie) throw new Error(`${id} : la solution n'affiche rien`);

  // 2. Le code cassé (lis-erreur) : il DOIT échouer, avec le bon code d'erreur.
  let erreur = null;
  if (ex.type === 'lis-erreur') {
    const casse = rustc(ex.code_casse);
    if (casse.ok) throw new Error(`${id} : le code cassé compile !`);
    if (!casse.stderr.includes(`error[${ex.code}]`)) throw new Error(`${id} : ${ex.code} attendu\n${casse.stderr}`);
    erreur = casse.stderr;
  }

  const lecon = ex.type === 'defi' ? ex.rappels.map((r) => `- ${r}`).join('\n') : ex.lecon;
  const criteres =
    ex.type === 'lis-erreur'
      ? [`L'erreur \`${ex.code}\` a **disparu**`, 'Le programme affiche le **bon texte**']
      : ['Le programme **compile**', 'Il affiche le **bon texte**'];

  const toml = [
    `id = "${id}"`,
    `module = "ownership"`,
    `titre = ${JSON.stringify(ex.titre)}`,
    `notion = ${JSON.stringify(ex.notion)}`,
    `type = "${ex.type}"`,
    ``,
    `# Généré par scripts/generer_ownership.mjs : modifie le générateur, pas ce fichier.`,
    `kael = ${JSON.stringify(ex.kael)}`,
    ...(ex.humeur ? [`humeur = "${ex.humeur}"`] : []),
    ``,
    `lecon = ${literal(lecon)}`,
    ``,
    `mission = ${literal(`${ex.mission}\n\nRésultat attendu :\n\n\`\`\`text\n${sortie}\n\`\`\``)}`,
    ``,
    ...(ex.type === 'lis-erreur'
      ? [`code_casse = ${literal(ex.code_casse)}`, ``, `erreur = ${literal(erreur)}`, ``, `erreur_corrigee = "${ex.code}"`, ``]
      : []),
    `sortie_attendue = ${literal(sortie)}`,
    ``,
    `criteres = [${criteres.map((c) => JSON.stringify(c)).join(', ')}]`,
    ``,
    `indices = [${ex.indices.map((i) => JSON.stringify(i)).join(', ')}]`,
    ``,
    `solution = ${literal(ex.solution)}`,
    ``,
  ].join('\n');

  writeFileSync(new URL(`${id}-${ex.slug}.toml`, dossier), toml);
  console.log(`✓ ${id}-${ex.slug} (${ex.type})`);
}

rmSync(atelier, { recursive: true, force: true });
console.log(`\n${EXERCICES.length} exercices générés.`);
