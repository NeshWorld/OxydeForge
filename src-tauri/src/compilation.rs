// Compile ton code avec le rustc installé sur le PC, puis lance le programme obtenu.
//
// Tout se passe dans un dossier de travail temporaire (l'« atelier ») :
//   main.rs        ← ton code
//   programme.exe  ← ce que rustc fabrique

use crate::exercices::{charger_catalogue, Exercice};
use serde::Serialize;
use std::ffi::OsStr;
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::{Duration, Instant};

/// Au-delà, on arrête le programme : il tourne sûrement en boucle.
const LIMITE: Duration = Duration::from_secs(5);
/// Au-delà, on coupe l'affichage (un `loop { println!(…) }` remplirait la mémoire).
const TAILLE_MAX: usize = 20_000;

#[derive(Debug, Serialize)]
pub struct Execution {
    pub compile: bool,
    /// Ce que rustc a répondu : erreurs et avertissements.
    pub compilateur: String,
    /// Les codes trouvés dans la réponse : E0384, E0382…
    pub codes_erreur: Vec<String>,
    /// Ce que ton programme a affiché (println!).
    pub sortie: String,
    /// Ce qu'il a écrit en erreur (un panic!, par exemple).
    pub sortie_erreur: String,
    pub code_sortie: Option<i32>,
    pub trop_long: bool,
    /// Temps passé par rustc, en millisecondes.
    pub duree_compilation_ms: u64,
    /// Temps passé par ton programme, en millisecondes (0 s'il n'a pas compilé).
    pub duree_execution_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct Critere {
    pub label: String,
    pub ok: bool,
    pub detail: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Verdict {
    pub execution: Execution,
    pub criteres: Vec<Critere>,
    pub reussi: bool,
}

/// Un atelier neuf à chaque compilation : deux compilations simultanées
/// (les tests, ou deux clics rapides) ne se marchent pas dessus.
fn atelier() -> Result<PathBuf, String> {
    static COMPTEUR: AtomicU64 = AtomicU64::new(0);
    let numero = COMPTEUR.fetch_add(1, Ordering::Relaxed);
    let dossier = std::env::temp_dir()
        .join("oxydeforge")
        .join(format!("{}-{numero}", std::process::id()));
    fs::create_dir_all(&dossier).map_err(|e| format!("atelier : {e}"))?;
    Ok(dossier)
}

/// Une commande système, sans fenêtre noire qui clignote sous Windows.
fn commande(programme: impl AsRef<OsStr>) -> Command {
    #[allow(unused_mut)]
    let mut c = Command::new(programme);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        c.creation_flags(CREATE_NO_WINDOW);
    }
    c
}

/// Repère les codes `error[E0384]` dans la réponse de rustc, sans doublon.
fn extraire_codes(texte: &str) -> Vec<String> {
    let mut codes: Vec<String> = Vec::new();
    for morceau in texte.split("error[").skip(1) {
        if let Some(fin) = morceau.find(']') {
            let code = morceau[..fin].to_string();
            if !codes.contains(&code) {
                codes.push(code);
            }
        }
    }
    codes
}

fn couper(mut texte: String) -> String {
    if texte.len() > TAILLE_MAX {
        let mut fin = TAILLE_MAX;
        while !texte.is_char_boundary(fin) {
            fin -= 1;
        }
        texte.truncate(fin);
        texte.push_str("\n… (sortie coupée)");
    }
    texte
}

/// Lit un flux du programme dans un fil à part : sinon un programme bavard
/// remplit le tuyau, se bloque, et on l'attend pour toujours.
fn lire_en_fond(flux: Option<impl Read + Send + 'static>) -> thread::JoinHandle<String> {
    thread::spawn(move || {
        let mut octets = Vec::new();
        if let Some(f) = flux {
            let _ = f.take(TAILLE_MAX as u64 * 2).read_to_end(&mut octets);
        }
        String::from_utf8_lossy(&octets).to_string()
    })
}

fn attendre(enfant: &mut Child) -> (Option<i32>, bool) {
    let debut = Instant::now();
    loop {
        match enfant.try_wait() {
            Ok(Some(statut)) => return (statut.code(), false),
            Ok(None) if debut.elapsed() > LIMITE => {
                let _ = enfant.kill();
                let _ = enfant.wait();
                return (None, true);
            }
            Ok(None) => thread::sleep(Duration::from_millis(20)),
            Err(_) => return (None, false),
        }
    }
}

pub fn compiler_et_lancer(code: &str) -> Result<Execution, String> {
    let dossier = atelier()?;
    let resultat = compiler_et_lancer_dans(&dossier, code);
    // On range l'atelier, quoi qu'il arrive.
    let _ = fs::remove_dir_all(&dossier);
    resultat
}

fn compiler_et_lancer_dans(dossier: &std::path::Path, code: &str) -> Result<Execution, String> {
    let dossier = dossier.to_path_buf();
    fs::write(dossier.join("main.rs"), code).map_err(|e| format!("main.rs : {e}"))?;
    let exe = dossier.join(if cfg!(windows) { "programme.exe" } else { "programme" });
    let _ = fs::remove_file(&exe);

    // 1. Compiler : rustc --edition 2021 main.rs -o programme.exe
    let debut_compilation = Instant::now();
    let rustc = commande("rustc")
        .current_dir(&dossier)
        .args(["--edition", "2021", "main.rs", "-o"])
        .arg(&exe)
        .output()
        .map_err(|e| format!("rustc introuvable ({e}). Rust est-il installé ?"))?;

    let duree_compilation_ms = debut_compilation.elapsed().as_millis() as u64;
    let compilateur = String::from_utf8_lossy(&rustc.stderr).to_string();
    let codes_erreur = extraire_codes(&compilateur);

    if !rustc.status.success() {
        return Ok(Execution {
            compile: false,
            compilateur,
            codes_erreur,
            sortie: String::new(),
            sortie_erreur: String::new(),
            code_sortie: None,
            trop_long: false,
            duree_compilation_ms,
            duree_execution_ms: 0,
        });
    }

    // 2. Lancer le programme fabriqué.
    let debut_execution = Instant::now();
    let mut enfant = commande(&exe)
        .current_dir(&dossier)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("lancement impossible : {e}"))?;

    let sortie = lire_en_fond(enfant.stdout.take());
    let sortie_erreur = lire_en_fond(enfant.stderr.take());
    let (code_sortie, trop_long) = attendre(&mut enfant);
    let duree_execution_ms = debut_execution.elapsed().as_millis() as u64;

    Ok(Execution {
        duree_compilation_ms,
        duree_execution_ms,
        compile: true,
        compilateur,
        codes_erreur,
        sortie: couper(sortie.join().unwrap_or_default()),
        sortie_erreur: couper(sortie_erreur.join().unwrap_or_default()),
        code_sortie,
        trop_long,
    })
}

/// Compare deux textes en ignorant les espaces en fin de ligne et les \r de Windows.
fn normaliser(texte: &str) -> String {
    texte.replace("\r\n", "\n").lines().map(str::trim_end).collect::<Vec<_>>().join("\n").trim().to_string()
}

/// Montre la PREMIÈRE ligne qui diffère, plutôt que deux longs textes à comparer à l'œil.
fn premiere_difference(attendu: &str, obtenu: &str) -> String {
    if obtenu.is_empty() {
        return "ton programme n'affiche rien".into();
    }
    let attendues: Vec<&str> = attendu.lines().collect();
    let obtenues: Vec<&str> = obtenu.lines().collect();
    for (i, (a, o)) in attendues.iter().zip(&obtenues).enumerate() {
        if a != o {
            return format!("ligne {} : attendu « {a} », obtenu « {o} »", i + 1);
        }
    }
    if obtenues.len() < attendues.len() {
        format!(
            "il manque des lignes : {} attendues, {} affichées (la suivante devait être « {} »)",
            attendues.len(),
            obtenues.len(),
            attendues[obtenues.len()]
        )
    } else {
        format!(
            "lignes en trop : {} attendues, {} affichées (en trop : « {} »)",
            attendues.len(),
            obtenues.len(),
            obtenues[attendues.len()]
        )
    }
}

pub fn juger(exercice: &Exercice, execution: Execution) -> Verdict {
    let mut criteres = Vec::new();

    criteres.push(Critere {
        label: "Le programme **compile**".into(),
        ok: execution.compile,
        detail: execution.codes_erreur.first().map(|c| format!("rustc répond {c}")),
    });

    if let Some(code) = &exercice.erreur_corrigee {
        criteres.push(Critere {
            label: format!("L'erreur `{code}` a **disparu**"),
            ok: !execution.codes_erreur.contains(code),
            detail: None,
        });
    }

    if let Some(attendu) = &exercice.sortie_attendue {
        let obtenu = normaliser(&execution.sortie);
        let ok = execution.compile && !execution.trop_long && obtenu == normaliser(attendu);
        let detail = if ok || !execution.compile {
            None
        } else if execution.trop_long {
            Some("le programme ne s'arrête pas".into())
        } else {
            Some(premiere_difference(&normaliser(attendu), &obtenu))
        };
        criteres.push(Critere { label: "Il affiche le **bon texte**".into(), ok, detail });
    }

    let reussi = criteres.iter().all(|c| c.ok);
    Verdict { execution, criteres, reussi }
}

/// Bouton Exécuter. `async` : la fenêtre reste fluide pendant que rustc travaille.
#[tauri::command(async)]
pub fn executer(code: String) -> Result<Execution, String> {
    compiler_et_lancer(&code)
}

/// Bouton Vérifier.
#[tauri::command(async)]
pub fn verifier(id: String, code: String) -> Result<Verdict, String> {
    let catalogue = charger_catalogue()?;
    let exercice = catalogue
        .exercices
        .into_iter()
        .find(|e| e.id == id)
        .ok_or_else(|| format!("exercice inconnu : {id}"))?;
    let execution = compiler_et_lancer(&code)?;
    Ok(juger(&exercice, execution))
}

// Le banc d'essai, comme dans Nullforge : chaque solution doit réussir,
// et chaque code cassé doit échouer.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn les_solutions_reussissent_et_les_codes_casses_echouent() {
        for ex in charger_catalogue().unwrap().exercices {
            let verdict = juger(&ex, compiler_et_lancer(&ex.solution).unwrap());
            assert!(verdict.reussi, "{} : la solution échoue {:?}", ex.id, verdict.criteres);

            if let Some(casse) = &ex.code_casse {
                let verdict = juger(&ex, compiler_et_lancer(casse).unwrap());
                assert!(!verdict.reussi, "{} : le code cassé passe", ex.id);
            }
        }
    }

    #[test]
    fn la_premiere_difference_est_designee() {
        assert_eq!(premiere_difference("1\n2\nFizzBuzz", "1\n2\nFizz"), "ligne 3 : attendu « FizzBuzz », obtenu « Fizz »");
        assert!(premiere_difference("a\nb", "a").starts_with("il manque des lignes"));
        assert!(premiere_difference("a", "a\nb").starts_with("lignes en trop"));
        assert_eq!(premiere_difference("a", ""), "ton programme n'affiche rien");
    }

    #[test]
    fn une_boucle_infinie_est_arretee() {
        let execution = compiler_et_lancer("fn main() { loop {} }").unwrap();
        assert!(execution.trop_long);
    }
}
