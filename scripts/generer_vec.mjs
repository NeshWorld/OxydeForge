// Génère le chapitre « Vec : la liste qui grandit » (exercices/vec-*.toml).
// Placé après « Possession et emprunt » : un Vec POSSÈDE ses éléments,
// et le parcourir pose les mêmes questions (déménager ou prêter ?).
//
// Mêmes règles que generer_ownership.mjs :
//   - chaque solution est compilée avec -D warnings puis lancée : sa vraie sortie
//     devient la sortie attendue ;
//   - chaque code cassé (lis-erreur) DOIT échouer avec le bon code d'erreur.
// Leçons : exemples avec d'autres valeurs que la mission. Indices : des pistes,
// jamais la ligne de solution toute faite.
//
// Usage (depuis la racine du projet) : node scripts/generer_vec.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const L = (...lignes) => lignes.join('\n');

const EXERCICES = [
  {
    n: 1,
    slug: 'liste-qui-grandit',
    type: 'lecon',
    titre: 'Une liste qui grandit',
    notion: 'vec! et len',
    kael: 'Le patron veut l’inventaire de la caisse à outils. Sauf que la caisse change tout le temps de taille. Un tableau à taille fixe ? Il a ri. Longtemps.',
    lecon: L(
      'Un **tableau** `[T; N]` a une taille **fixée** à la compilation. Un **`Vec`** (pour *vecteur*) peut **grandir et rétrécir** pendant que le programme tourne.',
      '',
      '```rust',
      'let couleurs = vec!["rouge", "vert"];   // la macro vec! crée un Vec déjà rempli',
      'println!("{:?}", couleurs);              // {:?} affiche tout le contenu',
      'println!("{} couleurs", couleurs.len()); // .len() : le nombre d’éléments',
      '```',
      '',
      '| | Tableau | `Vec` |',
      '|---|---|---|',
      '| Taille | fixe | **variable** |',
      '| Où vivent les éléments | sur la **pile** | sur le **tas** |',
      '| Création | `[1, 2, 3]` | `vec![1, 2, 3]` |',
      '',
      '> C’est l’équivalent de la **liste** Python : `[1, 2, 3]` en Python, `vec![1, 2, 3]` en Rust.',
    ),
    mission: 'Crée un `Vec` avec trois outils : « marteau », « pince » et « lime ». Affiche-le avec `{:?}`, puis affiche combien il contient d’outils.',
    indices: ['Les crochets de `vec!` ressemblent à ceux d’un tableau.', '`.len()` se met après le nom de la liste, et donne un nombre.'],
    solution: `fn main() {
    let outils = vec!["marteau", "pince", "lime"];
    println!("{:?}", outils);
    println!("{} outils dans la caisse", outils.len());
}`,
  },
  {
    n: 2,
    slug: 'push',
    type: 'lecon',
    titre: 'Ajouter avec push',
    notion: 'Vec::new, mut et push',
    kael: 'Les commandes arrivent une par une au guichet. Je les note au fur et à mesure. Enfin, j’essaie. Mon carnet n’a que trois pages.',
    lecon: L(
      'On peut partir d’un `Vec` **vide**, puis le remplir avec **`.push()`**, qui ajoute à la fin.',
      '',
      '```rust',
      'let mut scores = Vec::new();   // vide pour l’instant',
      'scores.push(4);',
      'scores.push(9);',
      'println!("{:?}", scores);       // [4, 9]',
      '```',
      '',
      '- **`mut`** est obligatoire : ajouter un élément **modifie** le `Vec`.',
      '- Rust devine le type des éléments au premier `push` : ici des `i32`.',
      '',
      '> En Python, c’est `scores.append(4)`.',
    ),
    mission: 'Pars d’un `Vec` vide de commandes. Ajoute les numéros 12, 7 puis 30, et affiche la liste.',
    indices: ['Un `Vec` qu’on remplit doit être déclaré modifiable.', 'Un `push` par commande, dans l’ordre demandé.'],
    solution: `fn main() {
    let mut commandes = Vec::new();
    commandes.push(12);
    commandes.push(7);
    commandes.push(30);
    println!("Commandes : {:?}", commandes);
}`,
  },
  {
    n: 3,
    slug: 'e0596-push-sans-mut',
    type: 'lis-erreur',
    titre: 'Le carnet verrouillé',
    notion: 'push sur un Vec non mut : E0596',
    code: 'E0596',
    humeur: 'gene',
    kael: 'J’ai voulu ajouter une commande au carnet… et il refuse. Le compilateur dit que le carnet n’est pas modifiable. Qui l’a verrouillé ? Ah. Moi.',
    lecon: L(
      '`.push()` **modifie** le `Vec`. Si la variable n’est pas `mut`, Rust refuse : c’est la règle **immuable par défaut**, la même que pour un nombre.',
      '',
      '**Lire l’erreur** :',
      '- `cannot borrow ... as mutable` : « je ne peux pas le **prêter pour modification** »',
      '- c’est exactement ce que fait `push` : il emprunte le `Vec` avec `&mut`',
      '- le `help:` te montre **où** ajouter le mot qui manque',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le corrigé.',
    code_casse: `fn main() {
    let carnet = Vec::new();
    carnet.push("boulons");
    carnet.push("rivets");
    println!("Carnet : {:?}", carnet);
}`,
    indices: ['La correction tient en **un seul mot**, sur la ligne du `let`.'],
    solution: `fn main() {
    let mut carnet = Vec::new();
    carnet.push("boulons");
    carnet.push("rivets");
    println!("Carnet : {:?}", carnet);
}`,
  },
  {
    n: 4,
    slug: 'lire-element',
    type: 'lecon',
    titre: 'Lire un élément',
    notion: 'index et len - 1',
    kael: 'Le four a noté ses températures toute la nuit. Le patron veut seulement la première et la dernière. Il dit que le milieu, c’est « du remplissage ».',
    lecon: L(
      'Comme pour un tableau, on lit un élément avec son **index**, entre crochets. Le premier est à l’index **0**.',
      '',
      '```rust',
      'let notes = vec![14, 9, 17];',
      'println!("{}", notes[0]);               // 14 : le premier',
      'println!("{}", notes[notes.len() - 1]); // 17 : le dernier',
      '```',
      '',
      '- Le dernier index vaut **`len() - 1`** : avec 3 éléments, les index vont de 0 à 2.',
      '- Un index trop grand ne compile pas en erreur : le programme **s’arrête net** à l’exécution (*panic*), comme pour le dépassement d’un `i32`.',
    ),
    mission: 'Avec les températures 820, 950, 1100 et 760, affiche la première, la dernière, puis le nombre de relevés.',
    indices: ['La première est à l’index 0.', 'Pour la dernière, sers-toi de la longueur de la liste.'],
    solution: `fn main() {
    let temperatures = vec![820, 950, 1100, 760];
    println!("Première : {} degrés", temperatures[0]);
    println!("Dernière : {} degrés", temperatures[temperatures.len() - 1]);
    println!("{} relevés", temperatures.len());
}`,
  },
  {
    n: 5,
    slug: 'parcourir-pret',
    type: 'lecon',
    titre: 'Parcourir sans perdre',
    notion: 'for x in &v',
    kael: 'Je dois peser chaque lingot de la réserve, puis rendre la liste au patron. Entière. Il compte, le patron.',
    lecon: L(
      'Un `for` peut parcourir un `Vec`. Mais attention : **comment** tu le parcours décide de qui garde la liste.',
      '',
      '| Écriture | Ce que fait la boucle | Après la boucle |',
      '|---|---|---|',
      '| `for x in &v` | **emprunte** la liste | `v` existe toujours ✅ |',
      '| `for x in v` | **prend** la liste (*move*) | `v` est vide ❌ |',
      '',
      '```rust',
      'let ages = vec![30, 41];',
      'for age in &ages {        // un prêt, comme &String',
      '    println!("{age}");',
      '}',
      'println!("{:?}", ages);   // ✅ la liste est toujours là',
      '```',
      '',
      'C’est la **possession** que tu connais : un `Vec` possède ses éléments, et la boucle peut soit **l’emprunter**, soit **le prendre**.',
    ),
    mission: 'Avec les poids 4, 7 et 2, calcule le poids total avec une boucle, affiche-le, puis affiche la liste entière.',
    indices: ['Il te faut un total modifiable, qui commence à 0.', 'Pour pouvoir afficher la liste **après** la boucle, la boucle doit seulement l’emprunter.'],
    solution: `fn main() {
    let poids = vec![4, 7, 2];
    let mut total = 0;
    for p in &poids {
        total += p;
    }
    println!("Poids total : {total} kg");
    println!("Lingots pesés : {:?}", poids);
}`,
  },
  {
    n: 6,
    slug: 'e0382-boucle-mange',
    type: 'lis-erreur',
    titre: 'La boucle a tout mangé',
    notion: 'for x in v déplace le Vec : E0382',
    code: 'E0382',
    humeur: 'inquiet',
    kael: 'J’ai fait l’appel des apprentis avec une boucle. Et maintenant la liste a disparu. La boucle l’a… mangée ?',
    lecon: L(
      '`for x in v` **prend** le `Vec` : la liste déménage dans la boucle, qui la libère à la fin. Après, `v` est vide : c’est l’erreur **E0382**, la même que pour une `String` déplacée.',
      '',
      '**Lire l’erreur** :',
      '- `value moved here` : la boucle `for` a **pris** la liste',
      '- `value borrowed here after move` : tu t’en sers après',
      '- le `help:` propose déjà la solution : **emprunter** au lieu de prendre',
    ),
    mission: 'Ce programme ne compile pas. Lis l’erreur, puis réécris-le corrigé : la boucle ne doit plus prendre la liste.',
    code_casse: `fn main() {
    let apprentis = vec!["Lina", "Bao", "Ines"];
    for nom in apprentis {
        println!("Présent : {nom}");
    }
    println!("{} apprentis", apprentis.len());
}`,
    indices: ['Relis le tableau de l’exercice précédent : une seule des deux écritures garde la liste.'],
    solution: `fn main() {
    let apprentis = vec!["Lina", "Bao", "Ines"];
    for nom in &apprentis {
        println!("Présent : {nom}");
    }
    println!("{} apprentis", apprentis.len());
}`,
  },
  {
    n: 7,
    slug: 'modifier-chaque',
    type: 'lecon',
    titre: 'Modifier chaque élément',
    notion: 'for x in &mut v et *x',
    kael: 'Le patron augmente tous les prix de 5 pièces. « L’inflation », il dit. Moi je dis qu’il veut une nouvelle enclume.',
    lecon: L(
      'Pour **modifier** chaque élément, la boucle emprunte la liste **en écriture** : `&mut`.',
      '',
      '```rust',
      'let mut niveaux = vec![1, 2, 3];',
      'for n in &mut niveaux {',
      '    *n *= 10;      // * : « la valeur au bout du prêt »',
      '}',
      'println!("{:?}", niveaux);   // [10, 20, 30]',
      '```',
      '',
      '- `n` n’est pas un nombre, c’est un **prêt** vers un nombre de la liste.',
      '- **`*n`** veut dire : « la valeur **pointée** par ce prêt ». C’est elle qu’on change.',
      '- Le `Vec` doit être `mut`, sinon pas de prêt en écriture (E0596, tu connais).',
    ),
    mission: 'Avec les prix 20, 35 et 50, augmente chaque prix de 5 avec une boucle, puis affiche la nouvelle liste.',
    indices: ['La boucle doit emprunter la liste **en écriture**.', 'Dans la boucle, c’est la valeur **au bout** du prêt qu’on augmente.'],
    solution: `fn main() {
    let mut prix = vec![20, 35, 50];
    for p in &mut prix {
        *p += 5;
    }
    println!("Nouveaux prix : {:?}", prix);
}`,
  },
  {
    n: 8,
    slug: 'preter-fonction',
    type: 'lecon',
    titre: 'Prêter une liste à une fonction',
    notion: '&Vec devient &[T]',
    kael: 'Le contrôleur veut voir la liste des températures pour trouver la plus haute. Je lui prête. Je ne la donne PAS. La dernière fois, il l’a perdue.',
    lecon: L(
      'Pour qu’une fonction **lise** un `Vec` sans le prendre, on lui **prête** : `&v`. Côté paramètre, on écrit une **tranche** `&[T]` :',
      '',
      '```rust',
      'fn premier(liste: &[i32]) -> i32 {',
      '    liste[0]',
      '}',
      '',
      'let v = vec![8, 3];',
      'println!("{}", premier(&v));   // &v se transforme tout seul en &[i32]',
      '```',
      '',
      '> C’est le même réflexe que **`&str` pour un texte** : `&[i32]` accepte un `Vec`, mais aussi un tableau. Le paramètre le plus **souple** gagne.',
    ),
    mission: 'Écris `plus_chaud(temps)` qui reçoit une tranche d’`i32` et renvoie la plus grande valeur, avec une boucle. Teste-la avec 820, 1100 et 950, puis affiche la liste pour prouver qu’elle est toujours là.',
    indices: ['Commence avec le premier élément comme « record », puis compare chaque élément à ce record.', 'Dans la boucle, `x` est un prêt : la valeur pointée s’écrit avec `*`.'],
    solution: `fn plus_chaud(temps: &[i32]) -> i32 {
    let mut record = temps[0];
    for t in temps {
        if *t > record {
            record = *t;
        }
    }
    record
}

fn main() {
    let releves = vec![820, 1100, 950];
    println!("Plus chaud : {} degrés", plus_chaud(&releves));
    println!("Relevés intacts : {:?}", releves);
}`,
  },
  {
    n: 9,
    slug: 'defi-tri-lingots',
    type: 'defi',
    titre: 'Le tri des lingots',
    notion: 'construire deux Vec',
    kael: 'Dernière tâche avant la pause : trier les lingots. Les légers à gauche, les lourds à droite. Moi, je les trie surtout par « celui-là me fait mal au dos ».',
    rappels: [
      '`Vec::new()` crée une liste vide, `.push()` ajoute à la fin',
      '`for x in &v` parcourt sans prendre la liste',
      '`*x` donne la valeur au bout du prêt',
    ],
    mission: 'Avec les lingots de 3, 8, 5, 12 et 1 kg, range dans `legers` ceux de moins de 5 kg, et les autres dans `lourds`. Affiche les deux listes.',
    indices: ['Deux listes vides et modifiables, puis une seule boucle.', 'Dans la boucle, un `if` décide dans quelle liste faire le `push`.'],
    solution: `fn main() {
    let lingots = vec![3, 8, 5, 12, 1];
    let mut legers = Vec::new();
    let mut lourds = Vec::new();
    for l in &lingots {
        if *l < 5 {
            legers.push(*l);
        } else {
            lourds.push(*l);
        }
    }
    println!("Légers : {:?}", legers);
    println!("Lourds : {:?}", lourds);
}`,
  },
];

// ───────────── Génération ─────────────

const atelier = mkdtempSync(join(tmpdir(), 'oxydeforge-vec-'));
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
  const id = `vec-${String(ex.n).padStart(2, '0')}`;

  // 1. La solution : aucun avertissement, puis on la lance.
  const solution = rustc(ex.solution, ['-D', 'warnings']);
  if (!solution.ok) throw new Error(`${id} : la solution a un problème\n${solution.stderr}`);
  const sortie = execFileSync(join(atelier, 'prog.exe'), { encoding: 'utf8' }).replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (!sortie) throw new Error(`${id} : la solution n'affiche rien`);
  if (/[×→]/.test(sortie)) throw new Error(`${id} : caractère impossible à taper au clavier dans la sortie`);

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
    `module = "vec"`,
    `titre = ${JSON.stringify(ex.titre)}`,
    `notion = ${JSON.stringify(ex.notion)}`,
    `type = "${ex.type}"`,
    ``,
    `# Généré par scripts/generer_vec.mjs : modifie le générateur, pas ce fichier.`,
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
