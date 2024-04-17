use std::collections::VecDeque;
use std::fmt::{Display, Formatter, Result as FmtResult};

use chrono::{DateTime, Duration, NaiveDateTime, TimeZone, Utc};
use serde::{Deserialize, Serialize, Serializer};
use specta::Type;

use crate::core::deck::Card;
use crate::core::student::Student;

#[derive(Serialize, Debug, Clone, Deserialize, Type)]
pub struct AssessmentWithStatus {
    pub assessment: Assessment,
    pub status: AssessmentStatus,
}

impl AssessmentWithStatus {
    pub fn new(
        assessment: Assessment
    ) -> Self {
        AssessmentWithStatus {
            assessment: assessment.clone(),
            status: AssessmentStatus::new(
                assessment.clone().get_state(),
                assessment.clone().get_progress(),
            ),
        }
    }
}

#[derive(Serialize, Debug, Clone, Deserialize, Type)]
pub struct Assessment {
    pub id: u32,
    pub title: String,
    pub students: Vec<Student>,
    pub cards: Vec<Card>,
    pub duration_in_sec: u32,
    pub student_evaluations: Vec<StudentEvaluation>,
}

impl Assessment {
    pub fn new(
        id: u32,
        title: String,
        students: Vec<Student>,
        cards: Vec<Card>,
        duration_in_sec: u32,
    ) -> Self {
        let student_evaluations: Vec<StudentEvaluation> =
            students
                .iter()
                .map(|student| {
                    StudentEvaluation::new(
                        student.clone(),
                        cards
                            .iter()
                            .map(|card| CardEvaluation::new(card.clone()))
                            .collect(),
                    )
                })
                .collect();

        Assessment {
            id,
            title,
            students,
            cards,
            duration_in_sec,
            student_evaluations,
        }
    }

    pub fn get_student_evaluation_by_student_id(&mut self, student_id: u32) -> Option<&mut StudentEvaluation> {
        for se in self.student_evaluations.iter_mut() {
            if se.student.id == student_id {
                return Some(se);
            }
        }
        Option::None
    }

    pub fn get_state(&self) -> AssessmentState {
        if self.student_evaluations.iter().all(|se| se.state == AssessmentState::Completed) {
            return AssessmentState::Completed;
        }

        if self.student_evaluations.iter().any(|se| se.state == AssessmentState::Completed) {
            return AssessmentState::InProgress;
        }

        if self.student_evaluations.iter().all(|se| se.state == AssessmentState::NotStarted) {
            return AssessmentState::NotStarted;
        }

        AssessmentState::NotStarted
    }

    pub fn get_progress(&self) -> i32 {
        let total_student_evaluations = self.student_evaluations.len();
        let completed_student_evaluations = self.student_evaluations.iter()
            .filter(|se| se.state == AssessmentState::Completed).count();
        if total_student_evaluations < 1 || completed_student_evaluations < 1 {
            return 0;
        }
        let progress = (completed_student_evaluations as f64 / total_student_evaluations as f64) * 100.0;
        progress as i32
    }
}

impl PartialEq for Assessment {
    fn eq(&self, other: &Self) -> bool {
        if self.get_state() != other.get_state() {
            return false;
        }
        if self.duration_in_sec != other.duration_in_sec {
            return false;
        }
        for (i, card) in self.cards.iter().enumerate() {
            if let Some(other_card) = other.cards.get(i) {
                if card != other_card {
                    return false;
                }
            } else {
                return false;
            }
        }
        for (i, student) in self.students.iter().enumerate() {
            if let Some(other_student) = other.students.get(i) {
                if student != other_student {
                    return false;
                }
            } else {
                return false;
            }
        }
        true
    }
}

#[derive(Serialize, Debug, Clone, Copy, PartialEq, Eq, Deserialize, Type)]
pub enum AssessmentState {
    NotStarted,
    InProgress,
    Completed,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct CardEvaluation {
    pub card: Card,
    pub start_date_str: Option<String>,
    pub end_date_str: Option<String>,
}

impl CardEvaluation {
    pub fn new(card: Card) -> Self {
        Self {
            card,
            start_date_str: Option::None,
            end_date_str: Option::None,
        }
    }

    pub fn is_read(&self) -> bool {
        self.start_date_str.is_some() && self.end_date_str.is_some()
    }
}

fn serialize_student_evaluation_state<S>(
    state: &AssessmentState,
    serializer: S,
) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
{
    serializer.serialize_str(&state.to_string())
}

impl Display for AssessmentState {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        match self {
            AssessmentState::NotStarted => write!(f, "NotStarted"),
            AssessmentState::InProgress => write!(f, "InProgress"),
            AssessmentState::Completed => write!(f, "Completed"),
        }
    }
}

#[derive(Serialize, Debug, Clone, Deserialize, Type)]
pub struct StudentEvaluation {
    pub eval_date_epoch: u32,
    pub student: Student,
    #[serde(serialize_with = "serialize_student_evaluation_state")]
    state: AssessmentState,
    card_evaluations: Vec<CardEvaluation>,
    card_read_order_queue: VecDeque<u32>,
    pub result: Option<StudentEvaluationResult>,
}

impl StudentEvaluation {
    pub fn new(student: Student, cards: Vec<CardEvaluation>) -> Self {
        Self {
            eval_date_epoch: Utc::now().timestamp() as u32,
            student,
            state: AssessmentState::NotStarted,
            card_evaluations: cards.clone(),
            card_read_order_queue: cards.clone().iter().map(|ce| ce.card.id).collect::<Vec<_>>().into(),
            result: Option::None,
        }
    }

    pub fn get_current_card(&mut self) -> Option<&mut CardEvaluation> {
        if let Some(next_card_read_id) = self.card_read_order_queue.front() {
            if let Some(ce) = self.get_card_evaluation_by_id(*next_card_read_id) {
                ce.start_date_str = Some(date_time_to_string(Utc::now()));
                return Some(ce);
            }
        }
        Option::None
    }

    pub fn card_read(&mut self) {
        if let Some(current_card_id) = self.card_read_order_queue.front() {
            if let Some(card_evaluation) = self.get_card_evaluation_by_id(*current_card_id) {
                card_evaluation.end_date_str = Some(date_time_to_string(Utc::now()));
                self.card_read_order_queue.pop_front();
            }
        }
    }

    pub fn get_card_evaluation_by_id(&mut self, card_evaluation_id: u32) -> Option<&mut CardEvaluation> {
        for card_eval in self.card_evaluations.iter_mut() {
            if card_eval.card.id == card_evaluation_id {
                return Some(card_eval);
            }
        }
        Option::None
    }

    pub fn get_card_read_count(&self) -> u32 {
        self.card_evaluations.iter().filter(|ce| ce.is_read()).count() as u32
    }

    pub fn get_evaluation_time_is_ms(&self) -> u32 {
        let mut total_duration = 0;
        for card_evaluation in self.card_evaluations.clone() {
            if card_evaluation.start_date_str.is_some() && card_evaluation.end_date_str.is_some() {
                let start_date = string_to_date_time(card_evaluation.start_date_str.unwrap().as_str()).unwrap();
                let end_date = string_to_date_time(card_evaluation.end_date_str.unwrap().as_str()).unwrap();
                let duration = end_date - start_date;
                total_duration = total_duration + duration.num_milliseconds();
            }
        }
        total_duration as u32
    }

    pub fn get_avg_card_read_time(&self) -> u32 {
        let mut total_duration = 0;
        let mut total_card_count = 0;
        for card_evaluation in self.card_evaluations.clone() {
            if card_evaluation.start_date_str.is_some() && card_evaluation.end_date_str.is_some() {
                let start_date = string_to_date_time(card_evaluation.start_date_str.unwrap().as_str()).unwrap();
                let end_date = string_to_date_time(card_evaluation.end_date_str.unwrap().as_str()).unwrap();
                let duration = end_date - start_date;
                total_duration = total_duration + duration.num_milliseconds();
                total_card_count += 1;
            }
        }
        if total_card_count < 1 {
            return 0;
        }
        (total_duration / total_card_count) as u32
    }

    pub fn get_full_name(&self) -> String {
        format!("{} {}", self.student.first_name, self.student.last_name)
    }

    pub fn start(&mut self) {
        self.state = AssessmentState::InProgress;
    }

    pub fn stop(&mut self) -> Result<(), String> {
        self.state = AssessmentState::Completed;
        self.result = Some(StudentEvaluationResult {
            evaluation_time_in_ms: self.get_evaluation_time_is_ms(),
            cards_read_count: self.get_card_read_count(),
        });
        Ok(())
    }

    pub fn reset_results(&mut self) {
        self.state = AssessmentState::NotStarted;
        self.result = Option::None;
        self.card_read_order_queue = self.card_evaluations.clone().iter()
            .map(|ce| ce.card.id).collect::<Vec<_>>().into();
        for card_evaluation in self.card_evaluations.iter_mut() {
            card_evaluation.start_date_str = Option::None;
            card_evaluation.end_date_str = Option::None;
        }
    }
}

#[derive(Serialize, Debug, Clone, Deserialize, Type)]
pub struct StudentEvaluationResult {
    pub evaluation_time_in_ms: u32,
    pub cards_read_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AssessmentStatus {
    pub state: AssessmentState,
    pub progress: i32,
}

impl AssessmentStatus {
    pub fn new(
        state: AssessmentState,
        progress: i32,
    ) -> AssessmentStatus {
        Self { state, progress }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct StudentEvaluationInitialState {
    student_name: String,
    active_card: CardEvaluation,
    card_read_duration_in_sec: u32,
}

impl StudentEvaluationInitialState {
    pub fn new(
        student_name: String,
        active_card: CardEvaluation,
        card_read_duration_in_sec: u32,
    ) -> Self {
        Self {
            student_name,
            active_card,
            card_read_duration_in_sec,
        }
    }
}

#[derive(Deserialize, Type)]
pub struct DeckCard {
    pub deck_id: u32,
    pub card_text: String,
    pub image_file_path: Option<String>,
}

fn date_time_to_string(date_time: DateTime<Utc>) -> String {
    date_time.format("%Y-%m-%d %H:%M:%S").to_string()
}

fn string_to_date_time(date_time_str: &str) -> Result<DateTime<Utc>, String> {
    let naive_datetime = NaiveDateTime::parse_from_str(date_time_str, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| e.to_string())?;
    Ok(Utc.from_utc_datetime(&naive_datetime))
}