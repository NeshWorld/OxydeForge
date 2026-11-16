// Génère le projet « Le chiffre de César » (exercices/cesar-*.toml).
//
// Un projet = un module avec `projet = true` (exercices/modules.toml) :
// les étapes se débloquent l'une après l'autre, et chaque étape s'ouvre avec
// le code de l'utilisateur de l'étape précédente. Les solutions ci-dessous
// grandissent donc d'étape en étape, comme le vrai code de l'utilisateur.
//
// Comme pour l'Entraînement : chaque solution est compilée avec -D warnings,
// puis lancée, et sa vraie sortie devient la sortie attendue.
//
// Usage (depuis la racine du projet) : node scripts/generer_cesar.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPRISE = 'L’éditeur reprend **ton code** de l’étape précédente : tu l’agrandis, tu ne repars pas de zéro.';

const ETAPES = [
  {
    slug: 'une-lettre',
    titre: 'Une lettre',
    notion: 'char, u8 et as',
    humeur: 'gene',
    kael: 'Les fonderies s’envoient des messages codés depuis toujours. Et moi… j’ai perdu la grille de décodage. On va en refaire une. Doucement : d’abord une seule lettre.',
    lecon: [
      'Le **chiffre de César** décale chaque lettre dans l’alphabet. Avec une clé de 3 : `A` devient `D`, `B` devient `E`…',
      '',
      'Une lettre seule, c’est un `char`, entre **apostrophes** : `\'A\'` (les guillemets `"A"` font un texte).',
      '',
      'Pour l’ordinateur, chaque lettre est un **nombre** (son code ASCII) :',
      '',
      '| Lettre | `A` | `B` | `C` | … | `Z` |',
      '|---|---|---|---|---|---|',
      '| Code | 65 | 66 | 67 | … | 90 |',
      '',
      '- `\'A\' as u8` donne **65** : la lettre devient un nombre',
      '- `66_u8 as char` donne **`\'B\'`** : le nombre redevient une lettre',
      '- donc `(\'A\' as u8 + 1) as char` donne `\'B\'`',
      '',
      'En Python, c’était `ord(\'A\')` et `chr(66)`.',
    ],
    mission: 'Écris une fonction `decaler(c: char, cle: u8) -> char` qui décale une lettre. Dans `main`, affiche `A`, `K` et `R` décalées (clés 3, 3 et 1).',
    indices: [
      'Le corps tient en une ligne : la lettre devient un nombre, on ajoute la clé, puis le nombre redevient une lettre. Relis le dernier exemple de la leçon.',
      'Dans `main` : un `{}` dans le texte, et l’appel de `decaler` après la virgule.',
    ],
    solution: `fn decaler(c: char, cle: u8) -> char {
    (c as u8 + cle) as char
}

fn main() {
    println!("A -> {}", decaler('A', 3));
    println!("K -> {}", decaler('K', 3));
    println!("R -> {}", decaler('R', 1));
}`,
  },
  {
    slug: 'un-mot',
    titre: 'Un mot entier',
    notion: 'chars(), String::new() et push',
    kael: 'Une lettre, c’est bien. Mais « D », comme message secret, c’est un peu court. Il me faut des mots entiers !',
    lecon: [
      REPRISE,
      '',
      '- `mot.chars()` donne les lettres **une par une** : `for l in mot.chars() { … }`',
      '- `String::new()` crée un texte **vide**, qu’on remplit ensuite (il doit être `mut`)',
      '- `sortie.push(l)` ajoute **une lettre** à la fin de `sortie`',
      '- la fonction reçoit un `&str` (elle **emprunte** le texte) et renvoie une `String` toute neuve',
      '',
      'En Python : `"".join(decaler(c) for c in texte)`. En Rust, on construit la `String` lettre par lettre.',
    ],
    mission: 'Garde `decaler`. Ajoute `chiffrer(texte: &str, cle: u8) -> String`, qui décale chaque lettre. Remplace le contenu de `main` : chiffre `KAEL` puis `FORGE`, avec la clé 3.',
    indices: [
      'Commence par une `String` **vide** et modifiable, puis une boucle `for` sur les lettres du texte.',
      'Dans la boucle : ajoute la lettre **décalée** à ton texte. Après la boucle : ton texte tout seul, **sans** `;`, pour le renvoyer.',
    ],
    solution: `fn decaler(c: char, cle: u8) -> char {
    (c as u8 + cle) as char
}

fn chiffrer(texte: &str, cle: u8) -> String {
    let mut resultat = String::new();
    for c in texte.chars() {
        resultat.push(decaler(c, cle));
    }
    resultat
}

fn main() {
    println!("KAEL -> {}", chiffrer("KAEL", 3));
    println!("FORGE -> {}", chiffrer("FORGE", 3));
}`,
  },
  {
    slug: 'bout-alphabet',
    titre: 'Le bout de l’alphabet',
    notion: 'b\'A\', % et tour de cadran',
    humeur: 'surpris',
    kael: 'J’ai codé « ZEBRE » et j’ai obtenu… « ]HEUH ». Un crochet ?! Depuis quand il y a des crochets dans l’alphabet ?',
    lecon: [
      REPRISE,
      '',
      'Le problème : `Z` vaut 90, et 90 + 3 = 93, le code de `]`. Il faut **revenir à `A`** après `Z`, comme une horloge.',
      '',
      'L’astuce en 3 temps. Exemple avec les **chiffres** `\'0\'` à `\'9\'` (10 symboles), décalés de 5 :',
      '',
      '- **1 ·** la **position** : `let rang = ch as u8 - b\'0\';` (`\'7\'` donne 7)',
      '- **2 ·** on décale **et on fait le tour** : `let suivant = (rang + 5) % 10;` (7 + 5 = 12, donc 2)',
      '- **3 ·** on revient à un symbole : `(b\'0\' + suivant) as char` donne `\'2\'`',
      '',
      'Pour l’alphabet, c’est la même idée avec `b\'A\'` et **26** lettres.',
      '',
      '`b\'0\'` est un raccourci pour `\'0\' as u8` : le nombre 48, directement en `u8`.',
    ],
    mission: 'Corrige `decaler` pour qu’après `Z` on revienne à `A`. Dans `main`, chiffre `XYZ` et `ZEBRE` avec la clé 3, puis `KAEL` avec la clé 25.',
    indices: [
      'D’abord la position de la lettre : 0 pour `A`, 25 pour `Z`.',
      'Puis les deux autres temps de la leçon : la clé et le tour avec `%`, puis le retour en lettre.',
    ],
    solution: `fn decaler(c: char, cle: u8) -> char {
    let position = c as u8 - b'A';
    let nouvelle = (position + cle) % 26;
    (b'A' + nouvelle) as char
}

fn chiffrer(texte: &str, cle: u8) -> String {
    let mut resultat = String::new();
    for c in texte.chars() {
        resultat.push(decaler(c, cle));
    }
    resultat
}

fn main() {
    println!("XYZ -> {}", chiffrer("XYZ", 3));
    println!("ZEBRE -> {}", chiffrer("ZEBRE", 3));
    println!("KAEL -> {}", chiffrer("KAEL", 25));
}`,
  },
  {
    slug: 'ponctuation',
    titre: 'Espaces et ponctuation',
    notion: 'is_ascii_uppercase() et return',
    humeur: 'inquiet',
    kael: 'J’ai voulu coder « RDV A LA FORGE, 8H ! » et le programme s’est écroulé. Il paraît que l’espace l’a vexé. Tu peux regarder ?',
    lecon: [
      REPRISE,
      '',
      'Essaie d’abord **sans rien changer** : le programme plante avec `attempt to subtract with overflow`. L’espace vaut 32, et `32 - 65` est impossible dans un `u8` (pas de négatifs).',
      '',
      'La solution : ne décaler **que les majuscules**, et laisser le reste tel quel.',
      '',
      '- `c.is_ascii_uppercase()` vaut `true` si `c` est une lettre de `A` à `Z`',
      '- `!` veut dire **non** : `!pret` vaut `true` quand `pret` vaut `false`',
      '- `return x;` sort **tout de suite** de la fonction, en renvoyant `x`',
    ],
    mission: 'Fais en sorte que `decaler` laisse passer tout ce qui n’est pas une majuscule. Dans `main`, chiffre `RDV A LA FORGE, 8H !` avec la clé 3.',
    indices: [
      'Au tout début de `decaler` : si `c` n’est **pas** une majuscule, sors tout de suite en la renvoyant telle quelle.',
    ],
    solution: `fn decaler(c: char, cle: u8) -> char {
    if !c.is_ascii_uppercase() {
        return c;
    }
    let position = c as u8 - b'A';
    let nouvelle = (position + cle) % 26;
    (b'A' + nouvelle) as char
}

fn chiffrer(texte: &str, cle: u8) -> String {
    let mut resultat = String::new();
    for c in texte.chars() {
        resultat.push(decaler(c, cle));
    }
    resultat
}

fn main() {
    println!("{}", chiffrer("RDV A LA FORGE, 8H !", 3));
}`,
  },
  {
    slug: 'decoder',
    titre: 'Décoder',
    notion: 'i32, rem_euclid et &String',
    humeur: 'determine',
    kael: 'Coder, on sait. Mais les autres fonderies attendent nos réponses, et moi je dois LIRE leurs messages. Il faut faire le chemin inverse !',
    lecon: [
      REPRISE,
      '',
      'Décoder, c’est décaler **en arrière** : une clé **négative**. Mais un `u8` ne peut pas être négatif : la clé passe en `i32`.',
      '',
      '- la position doit suivre : convertis-la en `i32` avec `as`',
      '- `%` garde le signe : `-2 % 26` vaut -2. Il faut **`rem_euclid(26)`**, qui donne 24 (souviens-toi des dettes de Kael !)',
      '- retour en lettre : le résultat est un `i32`, reconvertis-le en `u8` avant de l’ajouter à `b\'A\'`',
      '- `dechiffrer` n’a rien à recalculer : elle peut appeler `chiffrer` avec la clé **opposée**',
      '',
      'Pour passer une `String` à une fonction qui attend un `&str` : `&message` (on la **prête**).',
    ],
    mission: 'Passe la clé en `i32` partout, puis ajoute `dechiffrer(texte: &str, cle: i32) -> String`. Dans `main`, chiffre `LE CREUSET EST FISSURE` avec la clé 7, affiche le code, puis déchiffre-le.',
    indices: [
      'Où remplacer `%` par `.rem_euclid(26)` ? Et quelles variables passent en `i32` ?',
      '`dechiffrer` tient en une ligne : un appel à `chiffrer`, avec la clé de l’autre signe.',
      'Range le code dans une variable, affiche-la, puis prête-la à `dechiffrer` avec `&`.',
    ],
    solution: `fn decaler(c: char, cle: i32) -> char {
    if !c.is_ascii_uppercase() {
        return c;
    }
    let position = (c as u8 - b'A') as i32;
    let nouvelle = (position + cle).rem_euclid(26);
    (b'A' + nouvelle as u8) as char
}

fn chiffrer(texte: &str, cle: i32) -> String {
    let mut resultat = String::new();
    for c in texte.chars() {
        resultat.push(decaler(c, cle));
    }
    resultat
}

fn dechiffrer(texte: &str, cle: i32) -> String {
    chiffrer(texte, -cle)
}

fn main() {
    let secret = chiffrer("LE CREUSET EST FISSURE", 7);
    println!("Code : {secret}");
    println!("Clair : {}", dechiffrer(&secret, 7));
}`,
  },
  {
    slug: 'casser-le-code',
    titre: 'Bonus : casser le code',
    // L'énoncé ne montre que le début et la fin : la ligne lisible reste à trouver.
    masquer: true,
    notion: 'force brute avec for',
    humeur: 'sourire-en-coin',
    kael: 'On a intercepté un message d’une fonderie rivale. Pas de clé. Mais il n’y a que 25 clés possibles… On les essaie TOUTES ?',
    lecon: [
      REPRISE,
      '',
      'Le César a un gros défaut : seulement **25 clés** utiles. On peut toutes les essayer : c’est l’attaque par **force brute**.',
      '',
      '- `for n in 1..26` : de 1 à 25 (le 26 est **exclu**)',
      '- une seule des 25 lignes sera lisible : c’est la bonne clé',
    ],
    mission: 'Garde tes fonctions. Dans `main`, essaie les clés de 1 à 25 sur le message intercepté `VLPW L ZFMWTP WL NWP OF NZQQCP`, une ligne par clé. Puis trouve la ligne lisible 😉',
    indices: [
      'Range le message intercepté dans une variable.',
      'Une boucle sur les clés de 1 à 25. Dans la boucle : affiche la clé, puis le message déchiffré avec elle.',
    ],
    solution: `fn decaler(c: char, cle: i32) -> char {
    if !c.is_ascii_uppercase() {
        return c;
    }
    let position = (c as u8 - b'A') as i32;
    let nouvelle = (position + cle).rem_euclid(26);
    (b'A' + nouvelle as u8) as char
}

fn chiffrer(texte: &str, cle: i32) -> String {
    let mut resultat = String::new();
    for c in texte.chars() {
        resultat.push(decaler(c, cle));
    }
    resultat
}

fn dechiffrer(texte: &str, cle: i32) -> String {
    chiffrer(texte, -cle)
}

fn main() {
    let intercepte = "VLPW L ZFMWTP WL NWP OF NZQQCP";
    for cle in 1..26 {
        println!("{cle} : {}", dechiffrer(intercepte, cle));
    }
}`,
  },
];

// ───────────── Génération ─────────────

const atelier = mkdtempSync(join(tmpdir(), 'oxydeforge-cesar-'));
const dossier = new URL('../exercices/', import.meta.url);

function compiler(code) {
  writeFileSync(join(atelier, 'main.rs'), code);
  try {
    execFileSync('rustc', ['--edition', '2021', '-D', 'warnings', 'main.rs', '-o', 'prog.exe'], { cwd: atelier, stdio: 'pipe' });
    return null;
  } catch (e) {
    return e.stderr.toString();
  }
}

const literal = (texte) => {
  if (texte.includes("'''")) throw new Error(`texte avec ''' : ${texte.slice(0, 40)}`);
  return `'''\n${texte.replace(/\n+$/, '')}\n'''`;
};

ETAPES.forEach((etape, i) => {
  const numero = i + 1;
  const probleme = compiler(etape.solution);
  if (probleme) throw new Error(`${etape.slug} : avertissement ou erreur\n${probleme}`);
  const sortie = execFileSync(join(atelier, 'prog.exe'), { encoding: 'utf8' }).replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (!sortie) throw new Error(`${etape.slug} : la solution n'affiche rien`);
  // Vérifier exige toujours la sortie complète : seul l'affichage dans l'énoncé est raccourci.
  const lignes = sortie.split('\n');
  const montree = etape.masquer ? [...lignes.slice(0, 5), '…', ...lignes.slice(-2)].join('\n') : sortie;

  const toml = [
    `id = "cesar-${numero}"`,
    `module = "cesar"`,
    `titre = ${JSON.stringify(etape.titre)}`,
    `notion = ${JSON.stringify(etape.notion)}`,
    `type = "etape"`,
    ``,
    `# Généré par scripts/generer_cesar.mjs : modifie le générateur, pas ce fichier.`,
    `kael = ${JSON.stringify(etape.kael)}`,
    ...(etape.humeur ? [`humeur = "${etape.humeur}"`] : []),
    ``,
    `lecon = ${literal(etape.lecon.join('\n'))}`,
    ``,
    `mission = ${literal(`${etape.mission}\n\nRésultat attendu :\n\n\`\`\`text\n${montree}\n\`\`\``)}`,
    ``,
    `sortie_attendue = ${literal(sortie)}`,
    ``,
    `criteres = ["Le programme **compile**", "Il affiche le **bon texte**"]`,
    ``,
    `indices = [${etape.indices.map((x) => JSON.stringify(x)).join(', ')}]`,
    ``,
    `solution = ${literal(etape.solution)}`,
    ``,
  ].join('\n');

  writeFileSync(new URL(`cesar-${numero}-${etape.slug}.toml`, dossier), toml);
  console.log(`✓ cesar-${numero}-${etape.slug}`);
});

rmSync(atelier, { recursive: true, force: true });
console.log(`\n${ETAPES.length} étapes générées.`);
