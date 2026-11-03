use std::path::PathBuf;

use tauri::State;

use crate::{AppState, execute_and_save};
use crate::core::assessment::{Assessment, AssessmentWithStatus, CardEvaluation, DeckCard, StudentEvaluation, StudentEvaluationInitialState, StudentEvaluationResult};
use crate::core::deck::{Card, Deck};
use crate::core::student::{Student, StudentResults};

#[tauri::command]
#[specta::specta]
pub fn get_all_students(state: State<AppState>) -> Vec<Student> {
    state.get_engine().get_students()
}

#[tauri::command]
#[specta::specta]
pub fn create_student(
    first_name: String,
    last_name: String,
    class_name: String,
    state: State<AppState>,
) -> Result<Student, String> {
    execute_and_save(state, |engine| {
        engine.create_student(first_name, last_name, class_name)
    })
}

#[tauri::command]
#[specta::specta]
pub fn update_student(
    student_id: u32,
    first_name: String,
    last_name: String,
    class_name: String,
    state: State<AppState>,
) -> Result<Student, String> {
    execute_and_save(state, |engine| {
        engine.update_student(student_id, first_name, last_name, class_name)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn delete_student(student_id: u32, state: State<'_, AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.delete_student(student_id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn delete_deck(deck_id: u32, state: State<'_, AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.delete_deck(deck_id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_all_decks(state: State<'_, AppState>) -> Vec<Deck> {
    state.get_engine().get_decks()
}

#[tauri::command]
#[specta::specta]
pub fn create_deck(title: String, description: String, state: State<'_, AppState>) -> Result<Deck, String> {
    execute_and_save(state, |engine| {
        engine.create_deck(title, description, vec![])
    })
}

#[tauri::command]
#[specta::specta]
pub fn add_sample_decks(state: State<'_, AppState>) -> Result<Vec<Deck>, String> {
    execute_and_save(state, |engine| {
        engine.add_sample_decks()
    })
}

#[tauri::command]
#[specta::specta]
pub fn save_card_to_deck(card: DeckCard, state: State<'_, AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.add_card_to_deck(card.deck_id, card.card_text, card.image_file_path)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn set_card_image(
    deck_id: u32,
    card_id: u32,
    image_file_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<Card, String> {
    execute_and_save(state, |engine| {
        engine.set_card_image(deck_id, card_id, image_file_path)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn get_deck(deck_id: u32, state: State<'_, AppState>) -> Result<Deck, String> {
    state.get_engine().get_deck(deck_id)
}

#[tauri::command]
#[specta::specta]
pub fn get_all_assessments(
    include_completed_assessments: bool,
    state: State<'_, AppState>,
) -> Vec<AssessmentWithStatus> {
    state.get_engine()
        .get_assessments(include_completed_assessments)
        .into_iter()
        .map(AssessmentWithStatus::new)
        .collect()
}

#[tauri::command]
#[specta::specta]
pub fn get_assessment(assessment_id: u32, state: State<'_, AppState>) -> Result<Assessment, String> {
    state.get_engine()
        .get_assessment(assessment_id)
        .cloned()
        .ok_or("Assessment not found".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn start_evaluation(
    assessment_id: u32, student_id: u32, state: State<'_, AppState>,
) -> Result<Option<StudentEvaluationInitialState>, String> {
    execute_and_save(state, |engine| {
        let card_read_duration_in_sec = engine.get_assessment(assessment_id)?.duration_in_sec;
        let se = engine.get_student_evaluation(assessment_id, student_id)?;
        se.start();
        let full_name = se.get_full_name();
        let ce = se.get_current_card()?.clone();
        Some(StudentEvaluationInitialState::new(full_name, ce, card_read_duration_in_sec))
    })
}

#[tauri::command]
#[specta::specta]
pub fn stop_evaluation(
    assessment_id: u32,
    student_id: u32,
    state: State<AppState>,
) -> Result<Option<StudentEvaluationResult>, String> {
    execute_and_save(state, |engine| {
        let se = engine.get_student_evaluation(assessment_id, student_id)?;
        se.stop().ok()?;
        se.result.clone()
    })
}

#[tauri::command]
#[specta::specta]
pub fn delete_card(deck_id: u32, card_id: u32, state: State<AppState>) -> Result<u32, String> {
    execute_and_save(state, |engine| {
        engine.delete_card_from_deck(deck_id, card_id)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn update_deck(deck: Deck, state: State<AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.update_deck(deck)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn card_read_end(
    student_id: u32,
    assessment_id: u32,
    wrong: bool,
    state: State<AppState>,
) -> Option<CardEvaluation> {
    let mut engine = state.get_engine();
    engine.read_card(student_id, assessment_id, wrong);
    engine.get_student_evaluation(assessment_id, student_id)?
        .get_current_card()
        .cloned()
}

#[tauri::command]
#[specta::specta]
pub fn create_assessment(
    title: String,
    students: Vec<Student>,
    cards: Vec<Card>,
    duration_in_sec: u32,
    state: State<AppState>,
) -> Result<Assessment, String> {
    execute_and_save(state, |engine| {
        engine.create_assessment(title, students, cards, duration_in_sec)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn start_reading(
    student_id: u32,
    deck_id: u32,
    duration_in_sec: u32,
    shuffle: bool,
    state: State<AppState>,
) -> Result<u32, String> {
    execute_and_save(state, |engine| {
        engine.start_reading(student_id, deck_id, duration_in_sec, shuffle)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn copy_assessment(
    assessment_id: u32,
    state: State<AppState>,
) -> Result<Assessment, String> {
    execute_and_save(state, |engine| {
        engine.copy_assessment(assessment_id)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn delete_assessment(
    assessment_id: u32,
    state: State<AppState>,
) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.delete_assessment(assessment_id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn reset_student_evaluation(
    student_id: u32,
    assessment_id: u32,
    state: State<AppState>,
) -> Result<StudentEvaluation, String> {
    execute_and_save(state, |engine| {
        engine.reset_student_evaluation(assessment_id, student_id)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn get_students_read_results(
    student_id: u32,
    state: State<AppState>,
) -> Result<StudentResults, String> {
    let mut engine = state.get_engine();
    let student = engine.get_student(student_id).ok_or("Student not found")?;
    Ok(StudentResults {
        results: engine.get_read_results(student.id),
        student,
    })
}

#[tauri::command]
#[specta::specta]
pub fn add_words_to_deck(deck_id: u32, words: Vec<String>, state: State<AppState>) -> Result<Vec<Card>, String> {
    execute_and_save(state, |engine| {
        engine.add_words_to_deck(deck_id, words)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn update_card_text(deck_id: u32, card_id: u32, text: String, state: State<AppState>) -> Result<Card, String> {
    execute_and_save(state, |engine| {
        engine.update_card_text(deck_id, card_id, text)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn move_card(deck_id: u32, card_id: u32, new_index: u32, state: State<AppState>) -> Result<Vec<Card>, String> {
    execute_and_save(state, |engine| {
        engine.move_card(deck_id, card_id, new_index)
    })?
}

#[tauri::command]
#[specta::specta]
pub fn backup_data(file_path: String, state: State<AppState>) -> Result<(), String> {
    state.get_engine().backup(&PathBuf::from(file_path))
}

#[tauri::command]
#[specta::specta]
pub fn restore_data(file_path: String, state: State<AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.restore(&PathBuf::from(file_path))
    })?
}

#[tauri::command]
#[specta::specta]
pub fn export_results(file_path: String, headers: Vec<String>, state: State<AppState>) -> Result<u32, String> {
    state.get_engine().export_results(&PathBuf::from(file_path), headers)
}
