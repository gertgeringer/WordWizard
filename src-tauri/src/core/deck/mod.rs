use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct Card {
    pub id: u32,
    pub text: String,
    pub image_file_path: Option<String>
}

impl Card {
    pub fn new(id: u32, text: String, image_file_path: Option<String>) -> Self {
        Card { id, text, image_file_path }
    }
}

impl PartialEq for Card {
    fn eq(&self, other: &Self) -> bool {
        self.text == other.text &&
            self.image_file_path == other.image_file_path
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct Deck {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub cards: Vec<Card>,
}

impl Deck {
    pub fn new(id: u32, title: String, description: String, cards: Vec<Card>) -> Self {
        Deck {
            id,
            title,
            description,
            cards,
        }
    }
}