// Prevents console window on Windows in release builds — do not remove
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};

fn find_project_root() -> PathBuf {
    // 1. Explicit override (useful for packaged installs)
    if let Ok(root) = std::env::var("OCTO_ROOT") {
        let p = PathBuf::from(root);
        if p.join("backend/api.py").exists() {
            return p;
        }
    }

    // 2. Walk up from the executable to find the project root
    if let Ok(exe) = std::env::current_exe() {
        let mut candidate = exe.as_path();
        for _ in 0..6 {
            if let Some(parent) = candidate.parent() {
                if parent.join("backend/api.py").exists() {
                    return parent.to_path_buf();
                }
                candidate = parent;
            }
        }
    }

    // 3. CWD as last resort (works for `cargo tauri dev` from project root)
    std::env::current_dir().unwrap_or_default()
}

fn main() {
    let backend: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let be_setup = backend.clone();

    tauri::Builder::default()
        .setup(move |_app| {
            let root = find_project_root();
            match Command::new("python3")
                .args(["-m", "backend.api"])
                .current_dir(&root)
                .spawn()
            {
                Ok(child) => {
                    *be_setup.lock().unwrap() = Some(child);
                }
                Err(e) => {
                    eprintln!("[octo] failed to start backend: {e}");
                    eprintln!("[octo] root searched: {root:?}");
                    eprintln!("[octo] set OCTO_ROOT=/path/to/octopus-dashboard to override");
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Ok(mut guard) = backend.lock() {
                    if let Some(ref mut child) = *guard {
                        let _ = child.kill();
                    }
                }
            }
        });
}
