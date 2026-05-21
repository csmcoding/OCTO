// Prevents console window on Windows in release builds — do not remove
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::Manager;

fn find_project_root() -> PathBuf {
    // 1. Explicit override (useful for packaged installs without sidecar)
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

fn find_backend_binary(resource_dir: &Path) -> Option<PathBuf> {
    let triple = "x86_64-unknown-linux-gnu";

    // Tauri strips the target triple when packaging (deb/rpm puts the binary
    // in /usr/bin/ as plain "octo-backend"), so check exe-adjacent first.
    let exe_dir = std::env::current_exe().ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()));

    let mut candidates: Vec<PathBuf> = vec![
        resource_dir.join(format!("binaries/octo-backend-{triple}")),
        resource_dir.join("binaries/octo-backend"),
        resource_dir.join(format!("octo-backend-{triple}")),
        resource_dir.join("octo-backend"),
    ];

    if let Some(dir) = exe_dir {
        candidates.push(dir.join(format!("octo-backend-{triple}")));
        candidates.push(dir.join("octo-backend"));
    }

    candidates.into_iter().find(|p| p.exists())
}

fn main() {
    let backend: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let be_setup = backend.clone();

    tauri::Builder::default()
        .setup(move |app| {
            let resource_dir = app.path().resource_dir().unwrap_or_default();

            let child_result = match find_backend_binary(&resource_dir) {
                Some(binary) => {
                    eprintln!("[octo] starting sidecar: {binary:?}");
                    Command::new(&binary).spawn()
                }
                None => {
                    let root = find_project_root();
                    eprintln!("[octo] sidecar not found — falling back to python3 in {root:?}");
                    Command::new("python3")
                        .args(["-m", "backend.api"])
                        .current_dir(&root)
                        .spawn()
                }
            };

            match child_result {
                Ok(child) => {
                    *be_setup.lock().unwrap() = Some(child);
                }
                Err(e) => {
                    eprintln!("[octo] failed to start backend: {e}");
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
