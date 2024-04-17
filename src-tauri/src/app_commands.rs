use tauri::State;

use crate::{AppState, execute_and_save, get_db_file_path};
use crate::core::assessment::{Assessment, AssessmentWithStatus, CardEvaluation, DeckCard, StudentEvaluation, StudentEvaluationInitialState, StudentEvaluationResult};
use crate::core::deck::{Card, Deck};
use crate::core::student::{ReadResult, Student, StudentResults};

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
    state: State<AppState>,
) -> Result<Student, String> {
    execute_and_save(state, |engine| {
        engine.create_student(first_name, last_name)
    })
}

#[tauri::command]
#[specta::specta]
pub fn update_student(
    student_id: u32,
    first_name: String,
    last_name: String,
    state: State<AppState>,
) -> Result<Student, String> {
    execute_and_save(state, |engine| {
        engine.update_student(student_id, first_name, last_name).clone()
    })
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
pub fn save_card_to_deck(card: DeckCard, state: State<'_, AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.add_card_to_deck(card.deck_id, card.card_text, card.image_file_path)
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_deck(deck_id: u32, state: State<'_, AppState>) -> Deck {
    state.get_engine().get_deck(deck_id).clone()
}

#[tauri::command]
#[specta::specta]
pub fn get_all_assessments(
    include_completed_assessments: bool,
    state: State<'_, AppState>,
) -> Vec<AssessmentWithStatus> {
    state.get_engine().get_assessments(include_completed_assessments).iter().map(|a| {
        AssessmentWithStatus::new(a.clone())
    }).collect()
}

#[tauri::command]
#[specta::specta]
pub fn get_assessment(assessment_id: u32, state: State<'_, AppState>) -> Assessment {
    state.get_engine()
        .get_assessment(assessment_id)
        .unwrap()
        .clone()
}

#[tauri::command]
#[specta::specta]
pub fn start_evaluation(
    assessment_id: u32, student_id: u32, state: State<'_, AppState>,
) -> Option<StudentEvaluationInitialState> {
    let mut card_read_duration_in_sec = 0;
    if let Some(a) = state.get_engine().get_assessment(assessment_id) {
        card_read_duration_in_sec = a.duration_in_sec;
    }
    if let Some(se) = state.get_engine().get_student_evaluation(
        assessment_id, student_id,
    ) {
        se.start();
        let full_name = se.get_full_name().to_owned();
        if let Some(ce) = se.get_current_card() {
            return Some(
                StudentEvaluationInitialState::new(
                    full_name,
                    ce.clone(),
                    card_read_duration_in_sec,
                )
            );
        }
    }
    Option::None
}

#[tauri::command]
#[specta::specta]
pub fn stop_evaluation(
    assessment_id: u32,
    student_id: u32,
    state: State<AppState>,
) -> Result<Option<StudentEvaluationResult>, String> {
    if let Some(se) = state.get_engine().get_student_evaluation(assessment_id, student_id) {
        se.stop().unwrap();
    }
    state.get_engine().save(get_db_file_path()).unwrap();
    if let Some(se) = state.get_engine().get_student_evaluation(assessment_id, student_id) {
        return Ok(Some(StudentEvaluationResult {
            evaluation_time_in_ms: se.get_evaluation_time_is_ms(),
            cards_read_count: se.get_card_read_count(),
        }));
    }
    Ok(Option::None)
}

#[tauri::command]
#[specta::specta]
pub fn delete_card(deck_id: u32, card_id: u32, state: State<AppState>) -> Result<u32, String> {
    execute_and_save(state, |engine| {
        engine.delete_card_from_deck(deck_id, card_id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn update_deck(deck: Deck, state: State<AppState>) -> Result<(), String> {
    execute_and_save(state, |engine| {
        engine.update_deck(deck)
    })
}

#[tauri::command]
#[specta::specta]
pub fn card_read_end(
    student_id: u32,
    assessment_id: u32,
    state: State<AppState>,
) -> Option<CardEvaluation> {
    state.get_engine().read_card(student_id, assessment_id);
    if let Some(se) = state.get_engine().get_student_evaluation(
        assessment_id, student_id,
    ) {
        if let Some(next_card) = se.get_current_card() {
            return Some(next_card.clone());
        }
    }
    Option::None
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
        engine.create_assessment(
            title.to_owned(),
            students.clone(),
            cards.clone(),
            duration_in_sec,
        )
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
        engine.delete_assessment(
            assessment_id
        )
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_all_student_evaluations(
    student: Student,
    state: State<AppState>,
) -> Vec<i32> {
    state.get_engine().get_student_evaluation_results(student.clone())
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
) -> StudentResults {
    let mut engine = state.get_engine();
    let student = engine.get_student(student_id);
    let mut read_results = vec![];
    for assessment in engine.get_assessments(true).clone() {
        if let Some(se) = engine.get_student_evaluation(assessment.id, student.id) {
            read_results.push(ReadResult {
                eval_date_epoch: se.eval_date_epoch,
                total_cards: assessment.cards.len() as u32,
                total_cards_read: se.get_card_read_count(),
                avg_card_read_time: se.get_avg_card_read_time(),
                total_read_time: se.get_evaluation_time_is_ms(),
            });
        }
    }
    read_results.sort_by(|a, b| b.eval_date_epoch.cmp(&a.eval_date_epoch));
    StudentResults {
        student: student.clone(),
        results: read_results,
    }
}
