use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Type)]
pub struct Student {
    pub id: u32,
    pub first_name: String,
    pub last_name: String,
    /// The class the student is in, e.g. "Grade 2A". Empty when not set.
    #[serde(default)]
    pub class_name: String,
}

impl Student {
    pub fn new(id: u32, first_name: String, last_name: String, class_name: String) -> Self {
        Student {
            id,
            first_name,
            last_name,
            class_name,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ReadResult {
    pub title: String,
    #[serde(default)]
    pub eval_date_epoch: u32,
    pub total_cards: u32,
    pub total_cards_read: u32,
    /// Words the teacher marked as read wrong.
    pub total_cards_wrong: u32,
    pub wrong_words: Vec<String>,
    /// Percentage of the read words that were read correctly.
    pub accuracy: u32,
    /// Words read correctly per minute, the standard reading fluency measure.
    pub words_correct_per_minute: u32,
    pub avg_card_read_time: u32,
    pub total_read_time: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct StudentResults {
    pub student: Student,
    pub results: Vec<ReadResult>,
}
