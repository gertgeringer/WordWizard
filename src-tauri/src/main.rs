// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use directories::ProjectDirs;
use tauri::State;
use tauri_specta::*;

use core::Engine;

mod core;
mod app_commands;

pub struct AppState(Mutex<Engine>);

impl AppState {
    fn new(engine: Engine) -> Self {
        AppState(Mutex::new(engine))
    }

    fn get_engine(&self) -> std::sync::MutexGuard<'_, Engine> {
        // A panic while holding the lock poisons it; the data itself is still usable.
        self.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

fn get_db_file_path() -> PathBuf {
    get_root_file_path().join("data.json")
}

fn get_root_file_path() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "tensoft", "wordwizard") {
        let config_dir = proj_dirs.config_dir();
        fs::create_dir_all(config_dir).expect("Unable to create config directory");
        config_dir.to_path_buf()
    } else {
        panic!("Cannot find home directory");
    }
}

fn execute_and_save<F, T>(state: State<AppState>, command: F) -> Result<T, String>
    where
        F: FnOnce(&mut Engine) -> T,
{
    let mut engine = state.get_engine();
    let result = command(&mut engine);
    engine.save(get_db_file_path()).map_err(|e| e.to_string())?;
    Ok(result)
}

fn main() {
    let specta_builder = {
        let specta_builder = ts::builder()
            .commands(tauri_specta::collect_commands![
                app_commands::get_all_students,
                app_commands::create_student,
                app_commands::update_student,
                app_commands::delete_student,
                app_commands::get_all_decks,
                app_commands::create_deck,
                app_commands::get_deck,
                app_commands::add_sample_decks,
                app_commands::save_card_to_deck,
                app_commands::set_card_image,
                app_commands::update_deck,
                app_commands::create_assessment,
                app_commands::start_reading,
                app_commands::copy_assessment,
                app_commands::get_all_assessments,
                app_commands::get_assessment,
                app_commands::delete_assessment,
                app_commands::delete_deck,
                app_commands::delete_card,
                app_commands::card_read_end,
                app_commands::start_evaluation,
                app_commands::stop_evaluation,
                app_commands::reset_student_evaluation,
                app_commands::get_students_read_results,
                app_commands::add_words_to_deck,
                app_commands::update_card_text,
                app_commands::move_card,
                app_commands::backup_data,
                app_commands::restore_data,
                app_commands::export_results
            ]);

        #[cfg(debug_assertions)]
            let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    let engine = Engine::load(get_db_file_path());
    tauri::Builder::default()
        .manage(AppState::new(engine))
        .plugin(specta_builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
