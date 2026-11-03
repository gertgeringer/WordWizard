use std::collections::VecDeque;

use chrono::{DateTime, NaiveDateTime, SecondsFormat, TimeZone, Utc};
use serde::{Deserialize, Serialize};
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
            status: AssessmentStatus::new(
                assessment.get_state(),
                assessment.get_progress(),
            ),
            assessment,
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
        self.student_evaluations.iter_mut().find(|se| se.student.id == student_id)
    }

    pub fn get_state(&self) -> AssessmentState {
        if self.student_evaluations.iter().all(|se| se.state == AssessmentState::Completed) {
            return AssessmentState::Completed;
        }
        if self.student_evaluations.iter().all(|se| se.state == AssessmentState::NotStarted) {
            return AssessmentState::NotStarted;
        }
        AssessmentState::InProgress
    }

    /// Every stored picture path in the assessment, so they can be moved when restoring a backup.
    pub fn image_paths_mut(&mut self) -> impl Iterator<Item = &mut Option<String>> {
        self.cards.iter_mut().map(|c| &mut c.image_file_path)
            .chain(self.student_evaluations.iter_mut()
                .flat_map(|se| se.card_evaluations.iter_mut())
                .map(|ce| &mut ce.card.image_file_path))
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
        self.get_state() == other.get_state()
            && self.duration_in_sec == other.duration_in_sec
            && self.cards == other.cards
            && self.students == other.students
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
    /// Marked by the teacher when the student read the word wrong.
    #[serde(default)]
    pub wrong: bool,
}

impl CardEvaluation {
    pub fn new(card: Card) -> Self {
        Self {
            card,
            start_date_str: None,
            end_date_str: None,
            wrong: false,
        }
    }

    pub fn is_read(&self) -> bool {
        self.start_date_str.is_some() && self.end_date_str.is_some()
    }

    /// The time it took to read the card, if it was read.
    pub fn read_time_in_ms(&self) -> Option<i64> {
        let start = string_to_date_time(self.start_date_str.as_deref()?).ok()?;
        let end = string_to_date_time(self.end_date_str.as_deref()?).ok()?;
        Some((end - start).num_milliseconds().max(0))
    }
}

#[derive(Serialize, Debug, Clone, Deserialize, Type)]
pub struct StudentEvaluation {
    pub eval_date_epoch: u32,
    pub student: Student,
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
            card_read_order_queue: cards.iter().map(|ce| ce.card.id).collect(),
            card_evaluations: cards,
            result: None,
        }
    }

    pub fn get_current_card(&mut self) -> Option<&mut CardEvaluation> {
        let next_card_read_id = *self.card_read_order_queue.front()?;
        let ce = self.get_card_evaluation_by_id(next_card_read_id)?;
        ce.start_date_str = Some(date_time_to_string(Utc::now()));
        Some(ce)
    }

    pub fn card_read(&mut self, wrong: bool) {
        if let Some(&current_card_id) = self.card_read_order_queue.front() {
            if let Some(card_evaluation) = self.get_card_evaluation_by_id(current_card_id) {
                card_evaluation.end_date_str = Some(date_time_to_string(Utc::now()));
                card_evaluation.wrong = wrong;
                self.card_read_order_queue.pop_front();
            }
        }
    }

    pub fn get_card_evaluation_by_id(&mut self, card_evaluation_id: u32) -> Option<&mut CardEvaluation> {
        self.card_evaluations.iter_mut().find(|ce| ce.card.id == card_evaluation_id)
    }

    pub fn get_card_read_count(&self) -> u32 {
        self.card_evaluations.iter().filter(|ce| ce.is_read()).count() as u32
    }

    pub fn get_evaluation_time_is_ms(&self) -> u32 {
        self.card_evaluations.iter()
            .filter_map(|ce| ce.read_time_in_ms())
            .sum::<i64>() as u32
    }

    pub fn get_wrong_words(&self) -> Vec<String> {
        self.card_evaluations.iter()
            .filter(|ce| ce.is_read() && ce.wrong)
            .map(|ce| ce.card.text.clone())
            .collect()
    }

    /// Percentage of the read words that were read correctly.
    pub fn get_accuracy(&self) -> u32 {
        let read = self.get_card_read_count();
        if read == 0 {
            return 0;
        }
        let correct = read - self.get_wrong_words().len() as u32;
        (correct as f64 / read as f64 * 100.0).round() as u32
    }

    pub fn get_words_correct_per_minute(&self) -> u32 {
        let minutes = self.get_evaluation_time_is_ms() as f64 / 60_000.0;
        if minutes <= 0.0 {
            return 0;
        }
        let correct = self.get_card_read_count() - self.get_wrong_words().len() as u32;
        (correct as f64 / minutes).round() as u32
    }

    pub fn get_avg_card_read_time(&self) -> u32 {
        let read_times: Vec<i64> = self.card_evaluations.iter()
            .filter_map(|ce| ce.read_time_in_ms())
            .collect();
        if read_times.is_empty() {
            return 0;
        }
        (read_times.iter().sum::<i64>() / read_times.len() as i64) as u32
    }

    pub fn get_full_name(&self) -> String {
        format!("{} {}", self.student.first_name, self.student.last_name)
    }

    pub fn start(&mut self) {
        self.state = AssessmentState::InProgress;
    }

    pub fn stop(&mut self) -> Result<(), String> {
        self.state = AssessmentState::Completed;
        self.eval_date_epoch = Utc::now().timestamp() as u32;
        self.result = Some(StudentEvaluationResult {
            evaluation_time_in_ms: self.get_evaluation_time_is_ms(),
            cards_read_count: self.get_card_read_count(),
        });
        Ok(())
    }

    pub fn reset_results(&mut self) {
        self.state = AssessmentState::NotStarted;
        self.result = None;
        self.card_read_order_queue = self.card_evaluations.iter().map(|ce| ce.card.id).collect();
        for card_evaluation in self.card_evaluations.iter_mut() {
            card_evaluation.start_date_str = None;
            card_evaluation.end_date_str = None;
            card_evaluation.wrong = false;
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

/// Millisecond precision is needed, a single word is often read in less than a second.
fn date_time_to_string(date_time: DateTime<Utc>) -> String {
    date_time.to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn string_to_date_time(date_time_str: &str) -> Result<DateTime<Utc>, String> {
    if let Ok(date_time) = DateTime::parse_from_rfc3339(date_time_str) {
        return Ok(date_time.with_timezone(&Utc));
    }
    // Older data files stored dates with second precision only.
    let naive_datetime = NaiveDateTime::parse_from_str(date_time_str, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| e.to_string())?;
    Ok(Utc.from_utc_datetime(&naive_datetime))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn student(id: u32, name: &str) -> Student {
        Student::new(id, name.to_string(), "Test".to_string(), String::new())
    }

    fn card(id: u32, text: &str) -> Card {
        Card::new(id, text.to_string(), None)
    }

    #[test]
    fn dates_round_trip_with_millisecond_precision() {
        let now = Utc::now();
        let parsed = string_to_date_time(&date_time_to_string(now)).unwrap();
        assert_eq!(parsed.timestamp_millis(), now.timestamp_millis());
    }

    #[test]
    fn legacy_dates_still_parse() {
        let parsed = string_to_date_time("2024-03-01 10:20:30").unwrap();
        assert_eq!(parsed.to_rfc3339(), "2024-03-01T10:20:30+00:00");
    }

    #[test]
    fn read_time_uses_milliseconds() {
        let mut ce = CardEvaluation::new(card(1, "cat"));
        ce.start_date_str = Some("2024-03-01T10:20:30.100Z".to_string());
        ce.end_date_str = Some("2024-03-01T10:20:30.850Z".to_string());
        assert_eq!(ce.read_time_in_ms(), Some(750));
    }

    #[test]
    fn state_is_in_progress_once_any_student_started() {
        let mut a = Assessment::new(1, "t".into(), vec![student(1, "A"), student(2, "B")], vec![card(3, "cat")], 60);
        assert_eq!(a.get_state(), AssessmentState::NotStarted);
        a.student_evaluations[0].start();
        assert_eq!(a.get_state(), AssessmentState::InProgress);
        a.student_evaluations[0].stop().unwrap();
        assert_eq!(a.get_state(), AssessmentState::InProgress);
        a.student_evaluations[1].stop().unwrap();
        assert_eq!(a.get_state(), AssessmentState::Completed);
    }

    #[test]
    fn assessments_with_extra_cards_are_not_equal() {
        let a = Assessment::new(1, "t".into(), vec![student(1, "A")], vec![card(3, "cat")], 60);
        let b = Assessment::new(2, "t".into(), vec![student(1, "A")], vec![card(3, "cat"), card(4, "dog")], 60);
        assert!(a != b);
        assert!(b != a);
    }

    #[test]
    fn reading_cards_advances_the_queue() {
        let mut se = StudentEvaluation::new(student(1, "A"), vec![
            CardEvaluation::new(card(3, "cat")),
            CardEvaluation::new(card(4, "dog")),
        ]);
        assert_eq!(se.get_current_card().unwrap().card.text, "cat");
        se.card_read(false);
        assert_eq!(se.get_current_card().unwrap().card.text, "dog");
        se.card_read(true);
        assert!(se.get_current_card().is_none());
        assert_eq!(se.get_card_read_count(), 2);
        assert_eq!(se.get_wrong_words(), vec!["dog".to_string()]);
        assert_eq!(se.get_accuracy(), 50);
    }

    #[test]
    fn words_correct_per_minute_counts_only_correct_words() {
        let mut cards: Vec<CardEvaluation> = (0..4).map(|i| CardEvaluation::new(card(i, "word"))).collect();
        for (i, ce) in cards.iter_mut().enumerate() {
            // Each word took 10 seconds, so 4 words took 40 seconds.
            ce.start_date_str = Some(format!("2024-03-01T10:00:{}0.000Z", i));
            ce.end_date_str = Some(format!("2024-03-01T10:00:{}9.999Z", i));
            ce.wrong = i == 3;
        }
        let se = StudentEvaluation::new(student(1, "A"), cards);
        // 3 correct words in about 40 seconds is about 4.5 words per minute.
        assert_eq!(se.get_words_correct_per_minute(), 5);
        assert_eq!(se.get_accuracy(), 75);
    }

    #[test]
    fn older_data_without_wrong_marks_still_loads() {
        let json = r#"{"card":{"id":1,"text":"cat","image_file_path":null},"start_date_str":null,"end_date_str":null}"#;
        let ce: CardEvaluation = serde_json::from_str(json).unwrap();
        assert!(!ce.wrong);
    }
}
