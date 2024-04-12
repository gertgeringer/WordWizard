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