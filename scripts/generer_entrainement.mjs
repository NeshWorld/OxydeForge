// Génère les exercices du chapitre « Entraînement » (exercices/entr-*.toml).
//
// Pour chaque exercice : la solution est COMPILÉE avec rustc (le moindre avertissement
// est refusé), puis LANCÉE. Sa vraie sortie devient la sortie attendue : aucune faute
// de frappe possible entre l'énoncé et ce que Vérifier exigera.
//
// Usage (depuis la racine du projet) : node scripts/generer_entrainement.mjs
// Ajouter un exercice : ajoute un objet dans EXERCICES, puis relance.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EXERCICES = [
  // ───────────── Les nombres ont un type (u8, i32, u32, i64, f64 : 2 de chaque) ─────────────
  {
    slug: 'u8-limites',
    titre: 'Les limites d’un u8',
    notion: 'u8, i8, ::MIN et ::MAX',
    kael: 'Le cadran de la vieille presse ne monte que jusqu’à 255. Pourquoi 255 ? Aucune idée, j’ai toujours cru que c’était l’âge de la presse.',
    rappels: [
      '`u8` : entier **sans signe** sur 8 bits, de 0 à 255',
      '`i8` : entier **avec signe** sur 8 bits, de -128 à 127',
      '`u8::MIN` et `u8::MAX` donnent les limites d’un type, sans les apprendre par cœur',
    ],
    mission: 'Affiche les limites d’un `u8`, puis celles d’un `i8`, en utilisant `::MIN` et `::MAX`.',
    indices: ['`println!("Un u8 va de {} à {}", u8::MIN, u8::MAX);`'],
    solution: `fn main() {
    println!("Un u8 va de {} à {}", u8::MIN, u8::MAX);
    println!("Un i8 va de {} à {}", i8::MIN, i8::MAX);
}`,
  },
  {
    slug: 'u8-jauge',
    titre: 'La jauge pleine',
    notion: 'u8 et addition',
    kael: 'La jauge de vapeur affiche 200. J’ajoute 55… elle est pleine ! J’en ajoute encore un ? Non ? Bon, je ne touche plus à rien.',
    rappels: [
      'précise le type avec `: u8` : `let jauge: u8 = 200;`',
      'deux `u8` s’additionnent en un `u8`',
      'si le résultat dépassait 255, le programme **s’arrêterait** (panic) : Rust ne déborde jamais en silence',
    ],
    mission: 'Crée `jauge` (un `u8` qui vaut 200) et `ajout` (un `u8` qui vaut 55). Affiche le total sur 255.',
    indices: ['`let total = jauge + ajout;` puis `println!("Jauge : {total} / {}", u8::MAX);`'],
    solution: `fn main() {
    let jauge: u8 = 200;
    let ajout: u8 = 55;
    let total = jauge + ajout;
    println!("Jauge : {total} / {}", u8::MAX);
}`,
  },
  {
    slug: 'i32-negatifs',
    titre: 'Les nuits glaciales',
    notion: 'i32, négatifs et .abs()',
    kael: 'J’ai relevé le thermomètre trois fois : la nuit, le matin et à midi. Mes moustaches ont gelé puis dégelé. Tu me fais le bilan ?',
    rappels: [
      '`i32` accepte les **négatifs** : `let froid: i32 = -5;`',
      'soustraire un négatif revient à **ajouter** : `3 - (-5)` = 8',
      '`.abs()` donne la **valeur absolue** (sans le signe) : `(-5).abs()` vaut 5',
      'une moyenne entière : `(a + b + c) / 3` (les **parenthèses** d’abord, sinon seul `c` est divisé)',
    ],
    mission: 'Avec `nuit = -17`, `matin = 6` et `midi = 14` (des `i32`), affiche l’écart entre la nuit et midi, le froid de la nuit sans signe, puis la moyenne des trois relevés.',
    indices: ['`let ecart = midi - nuit;`', '`nuit.abs()` enlève le signe.', '`(nuit + matin + midi) / 3`'],
    solution: `fn main() {
    let nuit: i32 = -17;
    let matin: i32 = 6;
    let midi: i32 = 14;
    let ecart = midi - nuit;
    let moyenne = (nuit + matin + midi) / 3;
    println!("Ecart nuit-midi : {ecart} degrés");
    println!("Froid de la nuit : {} degrés sous zéro", nuit.abs());
    println!("Moyenne du jour : {moyenne} degré");
}`,
  },
  {
    slug: 'i32-trempe',
    variante: true,
    titre: 'Le bain de trempe',
    notion: 'i32, négatifs et priorités',
    kael: 'Le bain de trempe démarre à 5 degrés et perd 3 degrés par heure. Je l’ai oublié 7 heures. Il est gelé ou pas ?',
    rappels: [
      '`*` passe **avant** `-` : `10 - 2 * 4` vaut 2, pas 32',
      'un résultat peut devenir **négatif** : `2 - 9` vaut -7 (en `i32`, pas en `u32` !)',
      '`.abs()` enlève le signe : `(-7).abs()` vaut 7',
    ],
    mission: 'Le bain démarre à 5 degrés et perd 3 degrés par heure pendant 7 heures. Affiche la température finale, combien de degrés sous zéro, puis la chute totale.',
    indices: ['`let fin = depart - perte * heures;`', '`fin.abs()` pour « sous zéro ».', 'La chute : `depart - fin`.'],
    solution: `fn main() {
    let depart: i32 = 5;
    let perte: i32 = 3;
    let heures: i32 = 7;
    let fin = depart - perte * heures;
    println!("Température finale : {fin} degrés");
    println!("Sous zéro de : {} degrés", fin.abs());
    println!("Chute totale : {} degrés", depart - fin);
}`,
  },
  {
    slug: 'i32-caisses',
    titre: 'Ranger en caisses',
    notion: 'i32, / et %',
    kael: 'J’ai 47 pièces à ranger dans des caisses de 6. J’ai rempli des caisses jusqu’à ce que… j’en perde le compte. Tu m’aides ?',
    rappels: [
      'entre deux entiers, `/` donne une division **entière** : `47 / 6` vaut 7',
      '`%` donne le **reste** : `47 % 6` vaut 5',
    ],
    mission: 'Avec 47 pièces et des caisses de 6, affiche le nombre de caisses pleines et les pièces restantes.',
    indices: ['`pieces / par_caisse` et `pieces % par_caisse`.'],
    solution: `fn main() {
    let pieces = 47;
    let par_caisse = 6;
    println!("Caisses pleines : {}", pieces / par_caisse);
    println!("Pièces restantes : {}", pieces % par_caisse);
}`,
  },
  {
    slug: 'i32-dettes',
    variante: true,
    titre: 'Les dettes de Kael',
    notion: 'i32, / et % avec des négatifs',
    humeur: 'gene',
    kael: 'Bon… j’ai emprunté 25 pièces aux apprentis. Ça fait -25 dans mon carnet. Je dois le partager entre les 4. Ne le dis à personne.',
    rappels: [
      'Rust **tronque vers zéro** : `-7 / 2` vaut -3',
      'En Python, `-7 // 2` vaut -4 : Python arrondit **vers le bas**',
      'le reste garde le **signe** de la gauche : `-7 % 2` vaut -1 (Python dirait 1)',
    ],
    digression: [
      '**Qui a raison, mathématiquement ?** Les deux respectent `a = b × q + r` :',
      '',
      '| `-7` divisé par `2` | quotient `q` | reste `r` | vérification |',
      '|---|---|---|---|',
      '| **Rust** | -3 | **-1** | 2 × (-3) + (-1) = -7 |',
      '| **Python** | -4 | **1** | 2 × (-4) + 1 = -7 |',
      '',
      '- En maths (division **euclidienne**), le reste est toujours **positif** : Python est plus proche des maths.',
      '- Rust fait comme le **processeur** (et comme le C) : c’est plus rapide.',
      '- La version maths existe aussi en Rust : `(-7_i32).div_euclid(2)` vaut -4 et `(-7_i32).rem_euclid(2)` vaut 1.',
      '- Exemple concret, 3 h avant minuit : `-3 % 24` vaut -3 (absurde), `(-3_i32).rem_euclid(24)` vaut **21** h.',
    ].join('\n'),
    mission: 'Avec une dette de `-25` partagée entre `4` apprentis (des `i32`), affiche la part de chacun, le reste, puis la dette sans signe.',
    indices: ['`dette / apprentis` et `dette % apprentis`.', 'Rust donne -6 et -1, pas -7 et 3 comme Python.'],
    solution: `fn main() {
    let dette: i32 = -25;
    let apprentis: i32 = 4;
    println!("Part de chacun : {}", dette / apprentis);
    println!("Reste : {}", dette % apprentis);
    println!("Dette totale : {} pièces", dette.abs());
}`,
  },
  {
    slug: 'u32-tours',
    titre: 'Le compteur de tours',
    notion: 'u32 et grands entiers',
    kael: 'La grande roue tourne à 1 450 tours par minute, 8 heures par jour. J’ai voulu compter les tours à la main. J’ai eu le tournis.',
    rappels: [
      '`u32` : entier sans signe, jusqu’à environ 4,3 milliards',
      'les `_` rendent un grand nombre lisible : `1_450` vaut 1450',
    ],
    mission: 'La roue tourne à `1_450` tours par minute, 60 minutes par heure, 8 heures par jour (des `u32`). Affiche le nombre de tours par jour.',
    indices: ['`let par_jour = tours_minute * 60 * 8;`'],
    solution: `fn main() {
    let tours_minute: u32 = 1_450;
    let par_jour = tours_minute * 60 * 8;
    println!("Tours par jour : {par_jour}");
}`,
  },
  {
    slug: 'u32-pourcentage',
    titre: 'Le pourcentage de boulons',
    notion: 'u32, as f64 et {:.1}',
    kael: 'On a utilisé 1 234 boulons sur 5 000. Le patron veut le pourcentage. J’ai trouvé 0 %. Le patron n’a pas ri.',
    rappels: [
      'entre deux entiers, `1234 / 5000` donne **0** (division entière)',
      'il faut convertir **avant** de diviser : `utilises as f64 / total as f64`',
      '`{:.1}` arrondit l’affichage à une décimale',
    ],
    mission: 'Avec `utilises = 1_234` et `total = 5_000` (des `u32`), affiche le pourcentage utilisé, arrondi à une décimale.',
    indices: ['`let pct = utilises as f64 / total as f64 * 100.0;`', 'Puis `{pct:.1}` dans le texte.'],
    solution: `fn main() {
    let utilises: u32 = 1_234;
    let total: u32 = 5_000;
    let pct = utilises as f64 / total as f64 * 100.0;
    println!("Utilisés : {pct:.1} %");
}`,
  },
  {
    slug: 'i64-soleil',
    titre: 'Jusqu’au Soleil',
    notion: 'i64 et très grands nombres',
    humeur: 'surpris',
    kael: 'Le télescope du toit dit que le Soleil est à 149 597 870 700 mètres. Ça ne rentre même pas dans la case du formulaire !',
    rappels: [
      '`i32` s’arrête vers 2,1 milliards : trop petit ici',
      '`i64` va jusqu’à environ 9 milliards de milliards',
      'écris le type : `let distance_m: i64 = 149_597_870_700;`',
    ],
    mission: 'Stocke la distance Terre-Soleil en mètres dans un `i64`, puis affiche-la en kilomètres (division entière par 1000).',
    indices: ['`distance_m / 1000`'],
    solution: `fn main() {
    let distance_m: i64 = 149_597_870_700;
    println!("Distance Terre-Soleil : {} km", distance_m / 1000);
}`,
  },
  {
    slug: 'i64-secondes',
    titre: 'Les secondes d’une vie',
    notion: 'i64 et débordement évité',
    kael: 'Combien de secondes dure une vie de 80 ans ? J’ai lancé le calcul sur la vieille machine en i32… elle a fait de la fumée.',
    rappels: [
      '80 ans en secondes dépasse 2,5 milliards : trop grand pour un `i32`',
      'si `ans` est un `i64`, tout le calcul se fait en `i64`',
    ],
    mission: 'Avec `ans = 80` (un `i64`), calcule le nombre de secondes : 365 jours, 24 heures, 3600 secondes par heure.',
    indices: ['`let ans: i64 = 80;` puis `ans * 365 * 24 * 3600`.'],
    solution: `fn main() {
    let ans: i64 = 80;
    let secondes = ans * 365 * 24 * 3600;
    println!("{ans} ans = {secondes} secondes");
}`,
  },
  {
    slug: 'f64-prix',
    titre: 'Le prix au kilo',
    notion: 'f64 et {:.2}',
    kael: 'Le ferrailleur vend le cuivre 3,80 € le kilo. J’en prends 2,5 kilos. Il m’a rendu la monnaie… je crois qu’il m’a arnaqué. Vérifie ?',
    rappels: [
      'les décimaux s’écrivent avec un **point** : `2.5`, `3.8`',
      '`{:.2}` affiche **deux** décimales, parfait pour des euros',
    ],
    mission: 'Avec `poids = 2.5` kg et `prix_kilo = 3.8` €, affiche le prix total avec deux décimales.',
    indices: ['`let total = poids * prix_kilo;` puis `{total:.2}`.'],
    solution: `fn main() {
    let poids = 2.5;
    let prix_kilo = 3.8;
    let total = poids * prix_kilo;
    println!("Total : {total:.2} €");
}`,
  },
  {
    slug: 'f64-moyenne',
    titre: 'La moyenne pondérée',
    notion: 'f64 et coefficients',
    kael: 'L’apprenti a eu 12,5 en soudure (coefficient 2) et 15 en forge (coefficient 3). Il dit qu’il a 14 de moyenne. Je n’ose pas vérifier tout seul.',
    rappels: [
      'moyenne pondérée : (note1 × coef1 + note2 × coef2) / (coef1 + coef2)',
      'écris `15.0` et pas `15` pour rester en `f64`',
    ],
    mission: 'Calcule la moyenne pondérée de 12.5 (coef 2) et 15.0 (coef 3), affichée avec deux décimales.',
    indices: ['`(12.5 * 2.0 + 15.0 * 3.0) / 5.0`'],
    solution: `fn main() {
    let soudure = 12.5;
    let forge = 15.0;
    let moyenne = (soudure * 2.0 + forge * 3.0) / 5.0;
    println!("Moyenne : {moyenne:.2}");
}`,
  },

  // ───────────── Les fonctions ─────────────
  {
    slug: 'fn-cube',
    titre: 'Une fonction en appelle une autre',
    notion: 'fonctions qui s’appellent',
    kael: 'J’ai une fonction qui fait les carrés. Pour les cubes, je me suis dit : et si une fonction en appelait une autre ? Ça marche, ce truc ?',
    rappels: [
      'une fonction peut **appeler** une autre fonction, comme en Python',
      'une fonction **sans** `->` ne renvoie rien : `fn afficher(n: i32) { … }`',
      'la dernière ligne **sans** `;` est la valeur renvoyée',
    ],
    mission: 'Écris `carre`, puis `cube` qui **utilise** `carre`, puis `afficher(n)` qui affiche le cube de `n`. Appelle `afficher(3)` et `afficher(4)`.',
    indices: ['`fn cube(x: i32) -> i32 { carre(x) * x }`', '`fn afficher(n: i32) { println!("{n} au cube = {}", cube(n)); }`'],
    solution: `fn carre(x: i32) -> i32 {
    x * x
}

fn cube(x: i32) -> i32 {
    carre(x) * x
}

fn afficher(n: i32) {
    println!("{n} au cube = {}", cube(n));
}

fn main() {
    afficher(3);
    afficher(4);
}`,
  },
  {
    slug: 'fn-rectangle',
    titre: 'Plusieurs paramètres',
    notion: 'paramètres f64 et retour',
    kael: 'Je dois commander de la tôle pour une plaque de 4 mètres sur 3. Il me faut la surface et le tour. J’ai mesuré deux fois, j’ai trouvé trois résultats.',
    rappels: [
      'plusieurs paramètres se séparent par des virgules : `fn aire(l: f64, h: f64) -> f64`',
      'chaque paramètre a **son** type',
    ],
    mission: 'Écris `aire(l, h)` et `perimetre(l, h)` (des `f64`). Affiche-les pour une plaque de 4.0 sur 3.0, avec une décimale.',
    indices: ['`fn perimetre(l: f64, h: f64) -> f64 { 2.0 * (l + h) }`'],
    solution: `fn aire(l: f64, h: f64) -> f64 {
    l * h
}

fn perimetre(l: f64, h: f64) -> f64 {
    2.0 * (l + h)
}

fn main() {
    println!("Aire : {:.1}", aire(4.0, 3.0));
    println!("Périmètre : {:.1}", perimetre(4.0, 3.0));
}`,
  },
  {
    slug: 'fn-booleen',
    titre: 'Une fonction qui répond oui ou non',
    notion: 'fonction -> bool',
    kael: 'Les engrenages pairs vont à gauche, les impairs à droite. Ou l’inverse ? Bref, il me faut une fonction qui dit si un nombre est pair.',
    rappels: [
      'une fonction peut renvoyer un `bool` : `fn est_pair(n: i32) -> bool`',
      'une comparaison **est** déjà un `bool` : `n % 2 == 0` suffit, pas besoin de `if`',
    ],
    mission: 'Écris `est_pair(n)`. Pour chaque nombre de 1 à 4, affiche s’il est pair ou impair.',
    indices: ['Le corps tient en une ligne : `n % 2 == 0`', 'Dans la boucle : `if est_pair(n) { … } else { … }`'],
    solution: `fn est_pair(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    for n in 1..=4 {
        if est_pair(n) {
            println!("{n} : pair");
        } else {
            println!("{n} : impair");
        }
    }
}`,
  },
  {
    slug: 'fn-return',
    titre: 'Sortir en avance avec return',
    notion: 'return et division par zéro',
    kael: 'La machine à diviser a explosé quand j’ai divisé par zéro. Enfin, elle a fait « pfff ». Il faudrait qu’elle refuse AVANT de calculer.',
    rappels: [
      'd’habitude, la dernière ligne sans `;` est la valeur renvoyée',
      '`return valeur;` sert à sortir **en avance**, au milieu de la fonction',
      'typique : vérifier un cas impossible tout au début',
    ],
    mission: 'Écris `diviser(a, b)` qui renvoie `0` si `b` vaut 0 (avec `return`), et `a / b` sinon. Affiche `diviser(10, 2)` puis `diviser(7, 0)`.',
    indices: ['`if b == 0 { return 0; }` en première ligne.', 'La dernière ligne reste `a / b`, sans `return`.'],
    solution: `fn diviser(a: i32, b: i32) -> i32 {
    if b == 0 {
        return 0;
    }
    a / b
}

fn main() {
    println!("10 / 2 = {}", diviser(10, 2));
    println!("7 / 0 = {} (refusé)", diviser(7, 0));
}`,
  },
  {
    slug: 'fn-chaine',
    titre: 'La chaîne de fonctions',
    notion: 'fonctions qui travaillent ensemble',
    kael: 'Jour de coulée ! Le minerai passe au four : il n’en reste que 60 % en métal. Puis le métal part dans les moules à lingots de 5 kg. Le chef veut le compte, étape par étape.',
    rappels: [
      'découper un problème en **petites** fonctions : chacune fait **une** étape',
      'la sortie d’une étape devient l’**entrée** de la suivante, comme sur une chaîne de montage',
      'exemple : `let double = doubler(3);` puis `let total = ajouter_un(double);` donne 7',
    ],
    mission:
      'Écris `fondre(minerai)` qui garde 60 % du poids (`* 6 / 10`), et `couler(metal)` qui compte les lingots de 5 kg entiers (des `u32`). Pour 120 puis 45 kg de minerai, affiche les trois étapes.',
    indices: [
      '`couler` ne reçoit **pas** le minerai : elle reçoit ce que `fondre` a produit.',
      'Dans la boucle, range le résultat de chaque étape dans sa propre variable, puis affiche les trois.',
    ],
    solution: `fn fondre(minerai: u32) -> u32 {
    minerai * 6 / 10
}

fn couler(metal: u32) -> u32 {
    metal / 5
}

fn main() {
    for minerai in [120, 45] {
        let metal = fondre(minerai);
        let lingots = couler(metal);
        println!("{minerai} kg de minerai -> {metal} kg de métal -> {lingots} lingots");
    }
}`,
  },

  // ───────────── Les boucles : while, loop, for ─────────────
  {
    slug: 'while-cuve',
    titre: 'Remplir la cuve',
    notion: 'while',
    kael: 'La cuve doit atteindre 100 litres. La pompe envoie 30 litres d’un coup. J’ai laissé tourner… ça a débordé un peu. Beaucoup.',
    rappels: [
      '`while condition { … }` répète **tant que** la condition est vraie',
      'la condition est testée **avant** chaque tour',
      'n’oublie pas `mut` sur ce qui change',
    ],
    mission: 'Pars de `niveau = 0`. Tant que le niveau est sous 100, ajoute 30 et affiche le niveau.',
    indices: ['`while niveau < 100 { niveau += 30; … }`', 'Le dernier niveau affiché dépasse 100 : c’est normal, le test vient avant l’ajout.'],
    solution: `fn main() {
    let mut niveau = 0;
    while niveau < 100 {
        niveau += 30;
        println!("Niveau : {niveau} litres");
    }
}`,
  },
  {
    slug: 'while-rebours',
    titre: 'Le compte à rebours en while',
    notion: 'while et décrément',
    kael: 'Le four doit refroidir 5 minutes avant ouverture. J’ai ouvert à 3. Mes sourcils s’en souviennent. Fais-moi un vrai compte à rebours.',
    rappels: [
      'un `while` peut compter à l’envers : `n -= 1` à chaque tour',
      'après la boucle, le code continue normalement',
    ],
    mission: 'Avec un `while`, compte de 5 à 1 (un nombre par ligne), puis affiche « Ouverture ! ».',
    indices: ['`let mut n = 5; while n > 0 { …; n -= 1; }`'],
    solution: `fn main() {
    let mut n = 5;
    while n > 0 {
        println!("{n}");
        n -= 1;
    }
    println!("Ouverture !");
}`,
  },
  {
    slug: 'while-doubler',
    titre: 'Doubler jusqu’à dépasser',
    notion: 'while et compteur d’étapes',
    kael: 'La pression double à chaque coup de piston. Combien de coups pour dépasser 1000 ? J’ai parié 5. J’ai perdu mon goûter.',
    rappels: [
      'deux variables qui changent : la valeur **et** un compteur d’étapes',
      'quand on ne sait pas d’avance combien de tours il faut, c’est le travail de `while`',
    ],
    mission: 'Pars de `pression = 1`. Double-la tant qu’elle ne dépasse pas 1000, en comptant les étapes. Affiche le résultat final.',
    indices: ['`while pression <= 1000 { pression *= 2; etapes += 1; }`'],
    solution: `fn main() {
    let mut pression = 1;
    let mut etapes = 0;
    while pression <= 1000 {
        pression *= 2;
        etapes += 1;
    }
    println!("{pression} atteint en {etapes} étapes");
}`,
  },
  {
    slug: 'loop-presse',
    titre: 'La presse qui tape',
    notion: 'loop et break',
    kael: 'La presse doit frapper 3 fois exactement. La dernière fois, elle a frappé 47 fois. Il faut lui apprendre à s’ARRÊTER.',
    rappels: [
      '`loop { … }` tourne **pour toujours**…',
      '… jusqu’à un `break`',
      'pratique quand la condition d’arrêt est au milieu de la boucle',
    ],
    mission: 'Avec `loop`, affiche « Coup 1 » à « Coup 3 », puis sors de la boucle et affiche « Pièce forgée ! ».',
    indices: ['`coups += 1;` puis `println!`, puis `if coups == 3 { break; }`'],
    solution: `fn main() {
    let mut coups = 0;
    loop {
        coups += 1;
        println!("Coup {coups}");
        if coups == 3 {
            break;
        }
    }
    println!("Pièce forgée !");
}`,
  },
  {
    slug: 'loop-valeur',
    titre: 'loop qui renvoie une valeur',
    notion: 'break valeur',
    kael: 'Je cherche le premier nombre dont le carré dépasse 50. J’ai essayé 7 : 49, raté de peu ! Le suivant, je crois, mais je n’ose plus parier.',
    rappels: [
      'un `loop` peut **renvoyer une valeur** : `break valeur;`',
      'on la récupère avec `let resultat = loop { … };` (avec un `;` à la fin)',
    ],
    mission: 'Avec `let premier = loop { … };`, trouve le premier entier dont le carré dépasse 50, puis affiche-le avec son carré.',
    indices: ['`n += 1; if n * n > 50 { break n; }`'],
    solution: `fn main() {
    let mut n = 0;
    let premier = loop {
        n += 1;
        if n * n > 50 {
            break n;
        }
    };
    println!("Premier carré > 50 : {premier} x {premier} = {}", premier * premier);
}`,
  },
  {
    slug: 'loop-continue',
    titre: 'Sauter les pièces défectueuses',
    notion: 'loop et continue',
    kael: 'Toutes les pièces dont le numéro est un multiple de 3 sont ratées. Ne les affiche pas ! Personne ne doit savoir. Surtout pas le patron.',
    rappels: [
      '`continue` **saute** la fin du tour et passe au suivant',
      'avec un compteur manuel, incrémente **avant** le `continue`, sinon la boucle tourne en rond',
    ],
    mission: 'Avec `loop`, parcours les pièces 1 à 10 et affiche seulement celles qui ne sont pas multiples de 3.',
    indices: ['Ordre dans la boucle : `n += 1;`, puis `if n > 10 { break; }`, puis `if n % 3 == 0 { continue; }`, puis le `println!`.'],
    solution: `fn main() {
    let mut n = 0;
    loop {
        n += 1;
        if n > 10 {
            break;
        }
        if n % 3 == 0 {
            continue;
        }
        println!("Pièce {n} : bonne");
    }
}`,
  },
  {
    slug: 'for-pas',
    titre: 'La règle graduée',
    notion: 'for et step_by',
    kael: 'Il faut graver des repères sur la règle de l’atelier, tous les 5 millimètres, jusqu’à 20. Ma règle actuelle a des repères… un peu partout.',
    rappels: [
      '`(0..=20).step_by(5)` donne 0, 5, 10, 15, 20',
      'les parenthèses autour de l’intervalle sont obligatoires',
    ],
    mission: 'Affiche les repères de 0 à 20 mm, de 5 en 5.',
    indices: ['`for mm in (0..=20).step_by(5) { … }`'],
    solution: `fn main() {
    for mm in (0..=20).step_by(5) {
        println!("Repère : {mm} mm");
    }
}`,
  },
  {
    slug: 'for-enumerate',
    titre: 'Le tableau de service',
    notion: 'for, .iter() et .enumerate()',
    kael: 'Il faut afficher le tableau de service avec des numéros. Ferris, moi, et Rusty le chat de l’atelier. Oui, le chat est de service.',
    rappels: [
      '`.iter().enumerate()` donne des paires `(numéro, valeur)`, comme `enumerate` en Python',
      'le numéro commence à **0** : affiche `i + 1` pour commencer à 1',
    ],
    mission: 'Avec `["Ferris", "Kael", "Rusty"]`, affiche une liste numérotée à partir de 1.',
    indices: ['`for (i, nom) in equipe.iter().enumerate() { println!("{}. {nom}", i + 1); }`'],
    solution: `fn main() {
    let equipe = ["Ferris", "Kael", "Rusty"];
    for (i, nom) in equipe.iter().enumerate() {
        println!("{}. {nom}", i + 1);
    }
}`,
  },

  // ───────────── Le shadowing ─────────────
  {
    slug: 'shadow-texte-nombre',
    titre: 'Du texte au nombre',
    notion: 'shadowing et .parse()',
    kael: 'L’apprenti a tapé son âge au clavier : « 42 ». Mais c’est du texte ! Je ne peux pas lui ajouter un an. Enfin, pas en texte.',
    rappels: [
      '`"42".parse()` transforme du texte en nombre',
      '`.unwrap()` dit « je suis sûr que ça marche » (sinon le programme s’arrête)',
      'le masquage garde **le même nom** : `let age: i32 = age.parse().unwrap();`',
    ],
    mission: 'Pars de `let age = "42";`. Masque-le en nombre (`i32`), puis encore pour lui ajouter 1. Affiche le résultat.',
    indices: ['Trois `let age` à la suite : le texte, le nombre, puis `age + 1`.'],
    solution: `fn main() {
    let age = "42";
    let age: i32 = age.parse().unwrap();
    let age = age + 1;
    println!("L'an prochain : {age} ans");
}`,
  },
  {
    slug: 'shadow-nettoyer',
    titre: 'Nettoyer une étiquette',
    notion: 'shadowing, .trim() et .to_uppercase()',
    kael: 'Les étiquettes de l’imprimante sortent avec des espaces partout et en minuscules. Le patron veut du propre, en MAJUSCULES.',
    rappels: [
      '`.trim()` enlève les espaces au début et à la fin',
      '`.to_uppercase()` met en majuscules (et renvoie une `String`)',
      'chaque étape peut masquer la précédente : `let nom = nom.trim();`',
    ],
    mission: 'Pars de `let nom = "  Ferris  ";`. Masque-le deux fois (sans espaces, puis en majuscules), et affiche-le entre crochets.',
    indices: ['`let nom = nom.trim();` puis `let nom = nom.to_uppercase();`', 'Les crochets montrent qu’il n’y a plus d’espaces : `println!("[{nom}]");`'],
    solution: `fn main() {
    let nom = "  Ferris  ";
    let nom = nom.trim();
    let nom = nom.to_uppercase();
    println!("[{nom}]");
}`,
  },
  {
    slug: 'shadow-bloc',
    titre: 'Le test de pression',
    notion: 'shadowing dans un bloc',
    kael: 'Pendant le test, on triple la pression de la chaudière. Après le test, elle doit revenir comme avant. Normalement. J’espère.',
    rappels: [
      'un masquage **dans un bloc** `{ }` disparaît à la `}`',
      'la variable d’avant **réapparaît**, intacte',
    ],
    mission: 'Avec `pression = 10`, ouvre un bloc qui la masque en triple et l’affiche. Après le bloc, affiche-la encore.',
    indices: ['`{ let pression = pression * 3; println!(…); }`'],
    solution: `fn main() {
    let pression = 10;
    {
        let pression = pression * 3;
        println!("Pendant le test : {pression} bars");
    }
    println!("Après le test : {pression} bars");
}`,
  },
  {
    slug: 'shadow-unites',
    titre: 'Changer d’unité',
    notion: 'shadowing et changement de type',
    kael: 'La route jusqu’à la mine fait 5 kilomètres. Le géomètre veut des mètres, puis des centimètres. Il est très, très précis, le géomètre.',
    rappels: [
      'le masquage peut **changer le type** : `f64` puis `i64`',
      '`distance as i64` convertit un décimal en entier (la virgule est coupée)',
    ],
    mission: 'Pars de `let distance = 5.0;` (km). Masque-la en mètres et affiche-la, puis en centimètres entiers (`i64`) et affiche-la.',
    indices: ['`let distance = distance * 1000.0;`', '`let distance = distance as i64 * 100;`'],
    solution: `fn main() {
    let distance = 5.0;
    let distance = distance * 1000.0;
    println!("En mètres : {distance}");
    let distance = distance as i64 * 100;
    println!("En centimètres : {distance}");
}`,
  },

  // ───────────── Les constantes ─────────────
  {
    slug: 'const-prix',
    titre: 'Le prix du boulon',
    notion: 'const f64',
    kael: 'Le boulon coûte 15 centimes, depuis toujours et pour toujours. Le patron l’a gravé sur le mur. Avec mon front, presque.',
    rappels: [
      '`const PRIX_BOULON: f64 = 0.15;` : type **obligatoire**, nom en MAJUSCULES',
      'une constante se déclare en dehors de `main`',
    ],
    mission: 'Déclare `PRIX_BOULON` (0.15). Calcule le prix de 120 boulons et affiche-le avec deux décimales.',
    indices: ['`let quantite = 120;` puis `PRIX_BOULON * quantite as f64`'],
    solution: `const PRIX_BOULON: f64 = 0.15;

fn main() {
    let quantite = 120;
    let total = PRIX_BOULON * quantite as f64;
    println!("{quantite} boulons : {total:.2} €");
}`,
  },
  {
    slug: 'const-fonction',
    titre: 'Des constantes partout',
    notion: 'const utilisées dans une fonction',
    kael: 'La plaque standard fait toujours 8 sur 5. Toujours. Sauf la fois où je l’ai coupée de travers. On n’en parle pas.',
    rappels: [
      'une constante est visible dans **tout le fichier**, même dans les autres fonctions',
      'une fonction sans paramètre peut s’en servir : `fn aire() -> u32`',
    ],
    mission: 'Déclare `LARGEUR` (8) et `HAUTEUR` (5) en `u32`. Écris `aire()` qui les utilise, et affiche les dimensions puis l’aire.',
    indices: ['`fn aire() -> u32 { LARGEUR * HAUTEUR }`'],
    solution: `const LARGEUR: u32 = 8;
const HAUTEUR: u32 = 5;

fn aire() -> u32 {
    LARGEUR * HAUTEUR
}

fn main() {
    println!("Plaque de {LARGEUR} x {HAUTEUR}");
    println!("Aire : {}", aire());
}`,
  },
  {
    slug: 'const-calculee',
    titre: 'Une constante calculée',
    notion: 'const à partir d’autres const',
    kael: 'Combien de secondes dans une journée de travail entière ? Je compte toujours mes pauses en double, alors fais-le toi.',
    rappels: [
      'une constante peut être un **calcul** : `const SECONDES_PAR_HEURE: u32 = 60 * 60;`',
      'et utiliser une autre constante',
      'le calcul est fait **à la compilation**, pas à l’exécution',
    ],
    mission: 'Déclare `SECONDES_PAR_HEURE` (60 × 60), puis `SECONDES_PAR_JOUR` à partir de la première. Affiche les deux.',
    indices: ['`const SECONDES_PAR_JOUR: u32 = SECONDES_PAR_HEURE * 24;`'],
    solution: `const SECONDES_PAR_HEURE: u32 = 60 * 60;
const SECONDES_PAR_JOUR: u32 = SECONDES_PAR_HEURE * 24;

fn main() {
    println!("Une heure : {SECONDES_PAR_HEURE} secondes");
    println!("Un jour : {SECONDES_PAR_JOUR} secondes");
}`,
  },
  {
    slug: 'const-seuil',
    titre: 'La température limite',
    notion: 'const comme seuil',
    kael: 'Le four ne doit jamais dépasser 1200 degrés. Une fois, il a fait 1250. J’ai encore l’odeur de moustache grillée dans le nez.',
    rappels: [
      'une constante sert souvent de **seuil** : on la compare dans un `if`',
      'si le seuil change un jour, une seule ligne à modifier',
    ],
    mission: 'Déclare `TEMPERATURE_MAX` (1200, en `i32`). Pour 800, 1250 et 1100, affiche « OK » ou « SURCHAUFFE ».',
    indices: ['`for t in [800, 1250, 1100] { if t > TEMPERATURE_MAX { … } else { … } }`'],
    solution: `const TEMPERATURE_MAX: i32 = 1200;

fn main() {
    for t in [800, 1250, 1100] {
        if t > TEMPERATURE_MAX {
            println!("{t} degrés : SURCHAUFFE");
        } else {
            println!("{t} degrés : OK");
        }
    }
}`,
  },

  // ───────────── Les tableaux ─────────────
  {
    slug: 'tab-indices',
    titre: 'Le premier et le dernier',
    notion: 'indices et .len()',
    kael: 'Le planning de la semaine : lundi à vendredi. J’ai besoin du premier jour et du dernier. Le reste, je fais la sieste. Je plaisante. Un peu.',
    rappels: [
      'la première case est `tableau[0]`',
      'la dernière est `tableau[tableau.len() - 1]` (on compte à partir de 0)',
    ],
    mission: 'Avec `["lun", "mar", "mer", "jeu", "ven"]`, affiche le premier jour, le dernier, puis le nombre de jours.',
    indices: ['`jours[jours.len() - 1]` pour le dernier.'],
    solution: `fn main() {
    let jours = ["lun", "mar", "mer", "jeu", "ven"];
    println!("Premier : {}", jours[0]);
    println!("Dernier : {}", jours[jours.len() - 1]);
    println!("Nombre de jours : {}", jours.len());
}`,
  },
  {
    slug: 'tab-compter',
    titre: 'Compter les reçus',
    notion: 'parcourir et compter',
    kael: 'Le contrôle qualité a noté six pièces. Il faut savoir combien ont au moins 10. J’ai compté 4. Puis 5. Puis j’ai recompté : 4. Je crois.',
    rappels: [
      'un compteur `mut` qui part de 0',
      'on l’augmente dans la boucle quand la condition est vraie',
    ],
    mission: 'Avec les notes `[12, 8, 15, 9, 17, 11]`, compte celles qui valent au moins 10. Affiche « Reçues : X sur 6 ».',
    indices: ['`if note >= 10 { recues += 1; }`', 'Le 6 vient de `notes.len()`.'],
    solution: `fn main() {
    let notes = [12, 8, 15, 9, 17, 11];
    let mut recues = 0;
    for note in notes {
        if note >= 10 {
            recues += 1;
        }
    }
    println!("Reçues : {recues} sur {}", notes.len());
}`,
  },
  {
    slug: 'tab-minimum',
    titre: 'Le minimum et sa place',
    notion: 'parcourir avec les indices',
    kael: 'Une des cinq cuves fuit : c’est celle qui a le moins de liquide. Laquelle ? Je les ai toutes reniflées, ça ne m’a pas aidé.',
    rappels: [
      '`for i in 0..tableau.len()` parcourt les **positions**',
      'on garde la valeur minimale **et** sa position dans deux variables `mut`',
    ],
    mission: 'Avec `[42, 17, 63, 8, 25]`, trouve la plus petite valeur et sa position (en partant de 0).',
    indices: ['Commence avec `let mut min = cuves[0];` et `let mut position = 0;`', '`if cuves[i] < min { min = cuves[i]; position = i; }`'],
    solution: `fn main() {
    let cuves = [42, 17, 63, 8, 25];
    let mut min = cuves[0];
    let mut position = 0;
    for i in 0..cuves.len() {
        if cuves[i] < min {
            min = cuves[i];
            position = i;
        }
    }
    println!("Minimum : {min} (cuve {position})");
}`,
  },
  {
    slug: 'tab-modifier',
    titre: 'Un tableau modifiable',
    notion: 'let mut, tableau[i] = … et {:?}',
    kael: 'Inventaire ! Trois étagères : 10, 0 et 5 pièces. On a livré 7 pièces sur la deuxième, puis une pièce de plus partout. J’ai tout noté sur ma main. Elle est pleine.',
    rappels: [
      '`let mut stocks = [10, 0, 5];` : le tableau devient modifiable',
      '`stocks[1] = 7;` change une case',
      '`{:?}` affiche le tableau entier : `[11, 8, 6]`',
    ],
    mission: 'Pars de `[10, 0, 5]`. Mets 7 dans la deuxième case, puis ajoute 1 à chaque case, et affiche le tableau avec `{:?}`.',
    indices: ['`for i in 0..stocks.len() { stocks[i] += 1; }`'],
    solution: `fn main() {
    let mut stocks = [10, 0, 5];
    stocks[1] = 7;
    for i in 0..stocks.len() {
        stocks[i] += 1;
    }
    println!("Stocks : {:?}", stocks);
}`,
  },

  // ───────────── match ─────────────
  {
    slug: 'match-jours',
    titre: 'Les jours de la semaine',
    notion: 'match sur des nombres',
    kael: 'Le calendrier de l’atelier numérote les jours de 1 à 7. Moi je préfère les noms. Et le 9, c’est quel jour ? Ah. Aucun.',
    rappels: [
      'une branche par valeur : `1 => "lundi",`',
      '`_` attrape tout le reste (ici : les numéros invalides)',
    ],
    mission: 'Pour 1, 6 et 9, affiche le nom du jour (1 = lundi … 7 = dimanche), ou « inconnu ».',
    indices: ['`let nom = match n { 1 => "lundi", 2 => "mardi", …, _ => "inconnu" };`'],
    solution: `fn main() {
    for n in [1, 6, 9] {
        let nom = match n {
            1 => "lundi",
            2 => "mardi",
            3 => "mercredi",
            4 => "jeudi",
            5 => "vendredi",
            6 => "samedi",
            7 => "dimanche",
            _ => "inconnu",
        };
        println!("Jour {n} : {nom}");
    }
}`,
  },
  {
    slug: 'match-plusieurs',
    titre: 'Semaine ou week-end',
    notion: 'match avec | et intervalles',
    kael: 'Le samedi et le dimanche, l’atelier est fermé. Sauf pour moi, qui oublie à chaque fois. J’ai pris un café avec le chat, samedi.',
    rappels: [
      '`6 | 7 =>` : plusieurs valeurs pour une même branche',
      '`1..=5 =>` : tout un intervalle',
    ],
    mission: 'Pour 3, 6, 7 et 9, affiche « travail » (1 à 5), « week-end » (6 ou 7) ou « jour invalide ».',
    indices: ['`1..=5 => "travail", 6 | 7 => "week-end", _ => "jour invalide",`'],
    solution: `fn main() {
    for jour in [3, 6, 7, 9] {
        let type_jour = match jour {
            1..=5 => "travail",
            6 | 7 => "week-end",
            _ => "jour invalide",
        };
        println!("Jour {jour} : {type_jour}");
    }
}`,
  },
  {
    slug: 'match-texte',
    titre: 'Les commandes de la presse',
    notion: 'match sur du texte',
    kael: 'La presse obéit à la voix : « start », « stop »… J’ai dit « pause ». Elle m’a regardé bizarrement. Enfin, si une presse peut regarder.',
    rappels: [
      '`match` marche aussi sur du texte : `"start" => …`',
      'le texte doit correspondre **exactement**, majuscules comprises',
    ],
    mission: 'Pour les commandes `"start"`, `"pause"` et `"stop"`, affiche ce que fait la presse, ou « Commande inconnue ».',
    indices: ['`"start" => "La presse démarre", "stop" => "La presse s\'arrête", _ => "Commande inconnue",`'],
    solution: `fn main() {
    for commande in ["start", "pause", "stop"] {
        let action = match commande {
            "start" => "La presse démarre",
            "stop" => "La presse s'arrête",
            _ => "Commande inconnue",
        };
        println!("{commande} : {action}");
    }
}`,
  },
  {
    slug: 'match-garde',
    titre: 'match avec une condition',
    notion: 'les gardes : n if …',
    kael: 'Le thermomètre extérieur affiche des températures négatives, et ça fait geler les tuyaux. Il faut un panneau : gel, normal ou chaud.',
    rappels: [
      'une **garde** ajoute une condition à une branche : `n if n < 0 =>`',
      '`n` reçoit la valeur, puis la condition est testée',
    ],
    mission: 'Pour -5, 18 et 31, affiche « gel » (moins de 0), « normal » (0 à 25) ou « chaud ».',
    indices: ['`n if n < 0 => "gel", 0..=25 => "normal", _ => "chaud",`'],
    solution: `fn main() {
    for t in [-5, 18, 31] {
        let etat = match t {
            n if n < 0 => "gel",
            0..=25 => "normal",
            _ => "chaud",
        };
        println!("{t} degrés : {etat}");
    }
}`,
  },
  {
    slug: 'match-tuple',
    titre: 'FizzBuzz, version match',
    notion: 'match sur un tuple',
    kael: 'Les ouvriers ont rejoué au FizzBuzz. Quelqu’un a dit que match pouvait le faire en plus joli. Je n’ai pas compris, mais j’ai applaudi.',
    rappels: [
      'on peut `match` sur un **tuple** : `match (n % 3, n % 5)`',
      '`(0, 0) =>` : les deux restes valent 0',
      '`(0, _) =>` : le premier vaut 0, le second peu importe',
    ],
    mission: 'Refais le FizzBuzz de 1 à 15 avec un seul `match` sur `(n % 3, n % 5)`.',
    indices: ['`(0, 0) => println!("FizzBuzz"), (0, _) => println!("Fizz"), (_, 0) => println!("Buzz"), _ => println!("{n}"),`'],
    solution: `fn main() {
    for n in 1..=15 {
        match (n % 3, n % 5) {
            (0, 0) => println!("FizzBuzz"),
            (0, _) => println!("Fizz"),
            (_, 0) => println!("Buzz"),
            _ => println!("{n}"),
        }
    }
}`,
  },

  // ───────────── &str et String ─────────────
  {
    slug: 'texte-construire',
    titre: 'Graver une enseigne',
    notion: 'String::new, push_str et push',
    kael: 'Il faut graver l’enseigne de l’atelier, lettre par lettre. J’ai commencé par la fin. Ça faisait « !egroF ». On recommence.',
    rappels: [
      '`String::new()` crée une `String` **vide** (avec `let mut`)',
      '`push_str("…")` ajoute un texte, `push(\'!\')` ajoute **un** caractère',
      '`.len()` donne la longueur (en octets)',
    ],
    mission: 'Pars d’une `String` vide. Ajoute « Oxyde », puis « Forge », puis « ! ». Affiche-la, puis sa longueur.',
    indices: ['`let mut enseigne = String::new();`'],
    solution: `fn main() {
    let mut enseigne = String::new();
    enseigne.push_str("Oxyde");
    enseigne.push_str("Forge");
    enseigne.push('!');
    println!("{enseigne}");
    println!("{} caractères", enseigne.len());
}`,
  },
  {
    slug: 'texte-format',
    titre: 'Fabriquer un message',
    notion: '&str en paramètre et format!',
    kael: 'Il faut une machine à saluer les visiteurs. Je les salue moi-même d’habitude, mais j’oublie leur nom. Et le mien, parfois.',
    rappels: [
      'un paramètre texte s’écrit `nom: &str`',
      '`format!` marche comme `println!`, mais **renvoie** une `String` au lieu de l’afficher',
    ],
    mission: 'Écris `saluer(nom: &str) -> String` qui renvoie « Bonjour, … ! ». Affiche le salut pour Kael, puis pour Ferris.',
    indices: ['`format!("Bonjour, {nom} !")` sans point-virgule.'],
    solution: `fn saluer(nom: &str) -> String {
    format!("Bonjour, {nom} !")
}

fn main() {
    let message = saluer("Kael");
    println!("{message}");
    println!("{}", saluer("Ferris"));
}`,
  },
  {
    slug: 'texte-concat',
    titre: 'Coller deux morceaux',
    notion: 'String + &str',
    kael: 'J’ai deux moitiés de plaque : « Oxyde » et « Forge ». Il faut les souder. Et ajouter la version, parce que le patron aime les versions.',
    rappels: [
      '`String + &str` donne une nouvelle `String`',
      'la `String` de gauche **déménage** dans le résultat (on ne peut plus l’utiliser après)',
      'le masquage permet de continuer : `let nom = nom + " v1";`',
    ],
    mission: 'Pars de `String::from("Oxyde")` et `"Forge"`. Colle-les avec `+`, ajoute « v1 » de la même façon, et affiche le résultat.',
    indices: ['`let nom = debut + fin;` puis `let nom = nom + " v1";`'],
    solution: `fn main() {
    let debut = String::from("Oxyde");
    let fin = "Forge";
    let nom = debut + fin;
    let nom = nom + " v1";
    println!("{nom}");
}`,
  },
  {
    slug: 'texte-voyelles',
    titre: 'Compter les voyelles',
    notion: '.chars() et match sur des caractères',
    kael: 'Le graveur facture les voyelles plus cher, va savoir pourquoi. Combien y en a-t-il dans « fonderie » ? Je dis 3. Ou 4. Bon, compte.',
    rappels: [
      '`.chars()` parcourt un texte **caractère par caractère**',
      'un caractère s’écrit entre apostrophes : `\'a\'`',
      '`\'a\' | \'e\' | \'i\' =>` : plusieurs caractères dans une branche ; `_ => {}` ne fait rien',
    ],
    mission: 'Compte les voyelles (a, e, i, o, u, y) du mot « fonderie » et affiche le total.',
    indices: ['`for c in mot.chars() { match c { … => voyelles += 1, _ => {} } }`'],
    solution: `fn main() {
    let mot = "fonderie";
    let mut voyelles = 0;
    for c in mot.chars() {
        match c {
            'a' | 'e' | 'i' | 'o' | 'u' | 'y' => voyelles += 1,
            _ => {}
        }
    }
    println!("Voyelles dans {mot} : {voyelles}");
}`,
  },
];

// ───────────── Génération ─────────────

const atelier = mkdtempSync(join(tmpdir(), 'oxydeforge-gen-'));
const dossier = new URL('../exercices/', import.meta.url);
mkdirSync(dossier, { recursive: true });

// Le programme est déjà compilé par avertissements() (qui a réussi) : il n'y a plus qu'à le lancer.
function lancer() {
  return execFileSync(join(atelier, 'prog.exe'), { encoding: 'utf8' });
}

// Compile avec -D warnings : le moindre avertissement devient une erreur.
function avertissements(code) {
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

// Une variante (variante: true) prend le numéro du précédent suivi d'une lettre (03b, 03c…) :
// les numéros des autres exercices ne bougent pas, donc la progression déjà cochée reste juste.
let n = 0;
let lettre = 'a';
for (const ex of EXERCICES) {
  if (ex.variante) {
    lettre = String.fromCharCode(lettre.charCodeAt(0) + 1);
  } else {
    n += 1;
    lettre = 'a';
  }
  const numero = String(n).padStart(2, '0') + (ex.variante ? lettre : '');
  const probleme = avertissements(ex.solution);
  if (probleme) throw new Error(`${ex.slug} : avertissement ou erreur\n${probleme}`);
  const sortie = lancer();
  const propre = sortie.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (!propre) throw new Error(`${ex.slug} : la solution n'affiche rien`);

  const toml = [
    `id = "entr-${numero}"`,
    `module = "entrainement"`,
    `titre = ${JSON.stringify(ex.titre)}`,
    `notion = ${JSON.stringify(ex.notion)}`,
    `type = "defi"`,
    ``,
    `# Généré par scripts/generer_entrainement.mjs : modifie le générateur, pas ce fichier.`,
    `kael = ${JSON.stringify(ex.kael)}`,
    ...(ex.humeur ? [`humeur = "${ex.humeur}"`] : []),
    ``,
    `lecon = ${literal(ex.rappels.map((r) => `- ${r}`).join('\n'))}`,
    ``,
    ...(ex.digression ? [`digression = ${literal(ex.digression)}`, ``] : []),
    `mission = ${literal(`${ex.mission}\n\nRésultat attendu :\n\n\`\`\`text\n${propre}\n\`\`\``)}`,
    ``,
    `sortie_attendue = ${literal(propre)}`,
    ``,
    `criteres = ["Le programme **compile**", "Il affiche le **bon texte**"]`,
    ``,
    `indices = [${ex.indices.map((i) => JSON.stringify(i)).join(', ')}]`,
    ``,
    `solution = ${literal(ex.solution)}`,
    ``,
  ].join('\n');

  writeFileSync(new URL(`entr-${numero}-${ex.slug}.toml`, dossier), toml);
  console.log(`✓ entr-${numero}-${ex.slug}`);
}

rmSync(atelier, { recursive: true, force: true });
console.log(`\n${EXERCICES.length} exercices générés.`);
