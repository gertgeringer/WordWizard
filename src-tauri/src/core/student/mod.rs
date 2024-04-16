use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct Student {
    pub id: u32,
    pub first_name: String,
    pub last_name: String,
}

impl Student {
    pub fn new(id: u32, first_name: String, last_name: String) -> Self {
        Student {
            id,
            first_name,
            last_name,
        }
    }

    pub fn get_id(&self) -> u32 {
        self.id
    }
}

impl PartialEq for Student {
    fn eq(&self, other: &Self) -> bool {
        self.first_name == other.first_name &&
            self.last_name == other.last_name
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ReadResult {
    #[serde(default)]
    pub eval_date_epoch: u32,
    pub total_cards: u32,
    pub total_cards_read: u32,
    pub avg_card_read_time: u32,
    pub total_read_time: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct StudentResults {
    pub student: Student,
    pub results: Vec<ReadResult>,
}