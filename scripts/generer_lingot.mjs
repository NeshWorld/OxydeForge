// Génère le projet « Le lingot » (exercices/own-01a…c-*.toml), rangé dans le
// chapitre ownership, juste après own-01 (les noms own-01a, b, c se trient entre 01 et 02).
//
// Un mini-projet DANS un module normal : les 3 étapes partagent `chaine = "lingot"`.
// Elles se débloquent l'une après l'autre, et chaque étape s'ouvre avec le code
// de l'utilisateur de l'étape précédente (voir src/projet.ts). Les solutions
// ci-dessous grandissent donc d'une seule ligne par étape, comme son vrai code.
//
// `intro = true` : ces étapes restent visibles même quand le reste du chapitre
// est masqué (réglage « zone verte »).
//
// But pédagogique : faire SENTIR le déménagement (move) de la propriété.
//   1 (etape)      → A fabrique un lingot et le tient
//   2 (etape)      → A passe le lingot à B : il CHANGE DE MAINS (move)
//   3 (lis-erreur) → on redemande son lingot à A : E0382, A a les mains vides
//
// Chaque solution est compilée avec -D warnings puis lancée : sa vraie sortie
// devient la sortie attendue. Le code cassé de l'étape 3 DOIT échouer en E0382.
//
// Usage (depuis la racine du projet) : node scripts/generer_lingot.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPRISE = 'L’éditeur reprend **ton code** de l’étape précédente : tu l’agrandis, tu ne repars pas de zéro.';

const ETAPES = [
  {
    slug: 'le-lingot',
    titre: 'Le lingot sort de la forge',
    notion: 'un seul propriétaire',
    type: 'etape',
    humeur: 'sur-de-lui',
    kael: 'Nouveau chapitre, nouvelle pièce. Un lingot d’acier, du vrai. Regarde-moi le tenir : il est à moi, rien qu’à moi.',
    lecon: [
      'Un **lingot**, dans la forge, ça ne se tient qu’à **une seule paire de mains** à la fois.',
      '',
      'C’est **exactement** la règle n°1 de Rust : chaque valeur a **un seul propriétaire**.',
      '',
      'Le lingot sera une `String`. Le forgeron qui le tient sera une **variable**.',
      '',
      '```rust',
      'let forgeron_a = String::from("lingot d\'acier");  // A fabrique le lingot',
      'println!("A tient : {forgeron_a}");',
      '```',
      '',
      '> `{forgeron_a}` dans le `println!` affiche ce que A tient entre les mains.',
    ],
    mission: 'Crée le lingot : une `String` « lingot d’acier » tenue par `forgeron_a`. Puis affiche `A tient : …`.',
    indices: [
      '`let forgeron_a = String::from("lingot d\'acier");`',
      '`println!("A tient : {forgeron_a}");`',
    ],
    solution: `fn main() {
    let forgeron_a = String::from("lingot d'acier");
    println!("A tient : {forgeron_a}");
}`,
  },
  {
    slug: 'le-passage',
    titre: 'Le passage de main',
    notion: 'le déménagement (move)',
    type: 'etape',
    humeur: 'neutre',
    kael: 'Le patron veut que je file le lingot à l’apprenti B. Bon, d’accord. Je le lui passe… mais je le garde un peu aussi, hein ? Un demi chacun ?',
    lecon: [
      REPRISE,
      '',
      'A tend le lingot à B : `let forgeron_b = forgeron_a;`',
      '',
      'Mais un lingot, **ça ne se copie pas**. Il **change de mains**.',
      '',
      'On appelle ça un **déménagement** (*move*) : le lingot **quitte** A pour aller chez B.',
      '',
      '```rust',
      'let forgeron_b = forgeron_a;   // le lingot DÉMÉNAGE : il part de A, il arrive chez B',
      'println!("B tient : {forgeron_b}");',
      '```',
      '',
      '> Le lingot est **unique**. Après cette ligne, c’est **B** qui l’a. Et A ? On vérifie juste après… 👀',
    ],
    mission: 'Garde ton code. **Ajoute** le passage de main : A tend le lingot à B (`let forgeron_b = forgeron_a;`), puis affiche `B tient : …`.',
    indices: [
      '`let forgeron_b = forgeron_a;`',
      '`println!("B tient : {forgeron_b}");`',
    ],
    solution: `fn main() {
    let forgeron_a = String::from("lingot d'acier");
    println!("A tient : {forgeron_a}");
    let forgeron_b = forgeron_a;
    println!("B tient : {forgeron_b}");
}`,
  },
  {
    slug: 'a-les-mains-vides',
    titre: 'A a-t-il encore le lingot ?',
    notion: 'move et E0382',
    type: 'lis-erreur',
    code: 'E0382',
    humeur: 'surpris',
    kael: 'Attends… j’ai passé le lingot à B, et là je veux le remontrer au patron… et je l’ai plus ?! Mais je l’avais dans les mains il y a deux secondes !',
    lecon: [
      'Tu viens de passer le lingot de A à B. La question : **A l’a-t-il encore ?**',
      '',
      'Essayons. Le **code** ci-dessous ajoute une ligne qui **redemande son lingot à A** :',
      '',
      '```rust',
      'println!("Et A ? {forgeron_a}");   // A a-t-il encore le lingot ?',
      '```',
      '',
      'Et là, Rust **refuse de compiler**. Le lingot a déménagé chez B : A a les **mains vides**.',
      '',
      '**Lis l’erreur `E0382`** :',
      '- `value moved here` : **où** le lingot est parti (le passage à B)',
      '- `value borrowed here after move` : là où tu réclames un lingot que A n’a plus',
      '',
      'C’est **ça**, voir le *move* : Rust t’empêche de rattraper l’ancien propriétaire. 🔒',
    ],
    mission:
      'Ton code de l’étape 2 est déjà là (A tient, puis B tient). Le bloc **« Le code »** montre ce qui se passe si on **réaffiche A** : l’erreur `E0382`. Lis-la. Puis **ajoute une dernière ligne** qui dit la vérité, sans toucher au lingot : `A n\'a plus rien dans les mains`.',
    code_casse: `fn main() {
    let forgeron_a = String::from("lingot d'acier");
    println!("A tient : {forgeron_a}");
    let forgeron_b = forgeron_a;
    println!("B tient : {forgeron_b}");
    println!("Et A ? {forgeron_a}");
}`,
    indices: [
      'Tu n’as **pas** besoin de réafficher A (c’est justement ça qui casse). Ajoute juste une ligne de texte simple.',
      '`println!("A n\'a plus rien dans les mains");`',
    ],
    solution: `fn main() {
    let forgeron_a = String::from("lingot d'acier");
    println!("A tient : {forgeron_a}");
    let forgeron_b = forgeron_a;
    println!("B tient : {forgeron_b}");
    println!("A n'a plus rien dans les mains");
}`,
  },
];

// ───────────── Génération ─────────────

const atelier = mkdtempSync(join(tmpdir(), 'oxydeforge-lingot-'));
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

ETAPES.forEach((etape, i) => {
  const id = `own-01${'abc'[i]}`;

  // 1. La solution : aucun avertissement, puis on la lance.
  const sol = rustc(etape.solution, ['-D', 'warnings']);
  if (!sol.ok) throw new Error(`${etape.slug} : la solution a un souci\n${sol.stderr}`);
  const sortie = execFileSync(join(atelier, 'prog.exe'), { encoding: 'utf8' }).replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (!sortie) throw new Error(`${etape.slug} : la solution n'affiche rien`);

  // 2. Le code cassé (lis-erreur) : il DOIT échouer, avec le bon code d'erreur.
  let erreur = null;
  if (etape.type === 'lis-erreur') {
    const casse = rustc(etape.code_casse);
    if (casse.ok) throw new Error(`${etape.slug} : le code cassé compile !`);
    if (!casse.stderr.includes(`error[${etape.code}]`)) throw new Error(`${etape.slug} : ${etape.code} attendu\n${casse.stderr}`);
    erreur = casse.stderr;
  }

  const criteres =
    etape.type === 'lis-erreur'
      ? [`L'erreur \`${etape.code}\` a **disparu**`, 'Le programme affiche le **bon texte**']
      : ['Le programme **compile**', 'Il affiche le **bon texte**'];

  const toml = [
    `id = "${id}"`,
    `module = "ownership"`,
    `titre = ${JSON.stringify(etape.titre)}`,
    `notion = ${JSON.stringify(etape.notion)}`,
    `type = "${etape.type}"`,
    `chaine = "lingot"`,
    `intro = true`,
    ``,
    `# Généré par scripts/generer_lingot.mjs : modifie le générateur, pas ce fichier.`,
    `kael = ${JSON.stringify(etape.kael)}`,
    ...(etape.humeur ? [`humeur = "${etape.humeur}"`] : []),
    ``,
    `lecon = ${literal(etape.lecon.join('\n'))}`,
    ``,
    `mission = ${literal(`${etape.mission}\n\nRésultat attendu :\n\n\`\`\`text\n${sortie}\n\`\`\``)}`,
    ``,
    ...(etape.type === 'lis-erreur'
      ? [`code_casse = ${literal(etape.code_casse)}`, ``, `erreur = ${literal(erreur)}`, ``, `erreur_corrigee = "${etape.code}"`, ``]
      : []),
    `sortie_attendue = ${literal(sortie)}`,
    ``,
    `criteres = [${criteres.map((c) => JSON.stringify(c)).join(', ')}]`,
    ``,
    `indices = [${etape.indices.map((x) => JSON.stringify(x)).join(', ')}]`,
    ``,
    `solution = ${literal(etape.solution)}`,
    ``,
  ].join('\n');

  writeFileSync(new URL(`${id}-${etape.slug}.toml`, dossier), toml);
  console.log(`✓ ${id}-${etape.slug} (${etape.type})`);
});

rmSync(atelier, { recursive: true, force: true });
console.log(`\n${ETAPES.length} étapes générées.`);
