use std::{fs, io};
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::core::assessment::{Assessment, AssessmentState, StudentEvaluation};
use crate::core::deck::{Card, Deck};
use crate::core::student::Student;
use crate::get_root_file_path;

use self::store::InMemoryStore;

mod store;
mod samples;
mod backup;
pub mod assessment;
pub mod deck;
pub mod student;

#[derive(Serialize, Deserialize, Clone)]
pub struct Data {
    students: InMemoryStore<Student>,
    decks: InMemoryStore<Deck>,
    assessments: InMemoryStore<Assessment>,
    next_id: u32,
}

impl Data {
    pub fn new() -> Self {
        Self {
            students: InMemoryStore::new(),
            decks: InMemoryStore::new(),
            assessments: InMemoryStore::new(),
            next_id: 0,
        }
    }

    pub fn load(file_path: PathBuf) -> Self {
        match fs::read_to_string(&file_path) {
            Ok(content) => match serde_json::from_str(&content) {
                Ok(data) => data,
                Err(e) => {
                    // Keep the unreadable file around instead of overwriting it on the next save.
                    let backup = file_path.with_extension(format!("corrupt-{}.json", Utc::now().timestamp()));
                    eprintln!("Unable to parse {:?} ({}), moving it to {:?}", file_path, e, backup);
                    fs::rename(&file_path, &backup).expect("Unable to back up the corrupt data file");
                    Data::new()
                }
            },
            Err(ref e) if e.kind() == ErrorKind::NotFound => Data::new(),
            Err(e) => panic!("Unable to read {:?}: {}", file_path, e),
        }
    }
}

/// Pictures can be any size without losing quality and stay small on disk, so only SVG is supported.
fn validate_svg(source: &Path) -> Result<(), String> {
    let is_svg_file = source.extension()
        .and_then(std::ffi::OsStr::to_str)
        .is_some_and(|ext| ext.eq_ignore_ascii_case("svg"));
    if !is_svg_file {
        return Err("Only SVG pictures are supported".to_string());
    }
    let content = fs::read_to_string(source).map_err(|e| format!("Unable to read the picture: {}", e))?;
    if !content.contains("<svg") {
        return Err("The selected file is not a valid SVG picture".to_string());
    }
    Ok(())
}

/// Copies the picture into the app's folder, so it keeps working when the original is moved.
fn store_card_image(source: &str, deck_id: u32, card_id: u32) -> Result<String, String> {
    let source = Path::new(source);
    validate_svg(source)?;
    let destination_dir = get_root_file_path().join("media").join("cards").join("images");
    fs::create_dir_all(&destination_dir).map_err(|e| e.to_string())?;
    // A unique name, older readings may still show the previous picture of this word.
    let destination = destination_dir.join(format!("{}.{}.{}.svg", deck_id, card_id, Utc::now().timestamp_millis()));
    fs::copy(source, &destination).map_err(|e| format!("Unable to copy the picture: {}", e))?;
    Ok(destination.to_string_lossy().into_owned())
}

/// Shuffles the words so students can not learn the order by heart.
fn shuffle_cards(cards: &mut [Card]) {
    // A small xorshift generator is plenty random for word order.
    let mut seed = Utc::now().timestamp_nanos_opt().unwrap_or_default() as u64 | 1;
    for i in (1..cards.len()).rev() {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        cards.swap(i, (seed % (i as u64 + 1)) as usize);
    }
}

pub struct Engine {
    data: Data,
}

impl Engine {
    pub fn load(file_path: PathBuf) -> Self {
        let data = Data::load(file_path);
        Engine {
            data
        }
    }

    fn get_next_id(&mut self) -> u32 {
        let id = self.data.next_id;
        self.data.next_id += 1;
        id
    }

    pub fn create_student(&mut self, first_name: String, last_name: String, class_name: String) -> Student {
        let id = self.get_next_id();
        self.data.students.insert(id, Student::new(id, first_name, last_name, class_name))
    }

    pub fn update_student(
        &mut self,
        student_id: u32,
        first_name: String,
        last_name: String,
        class_name: String,
    ) -> Result<Student, String> {
        let student = self.data.students.get(student_id).ok_or("Student not found")?;
        student.first_name = first_name;
        student.last_name = last_name;
        student.class_name = class_name;
        let student = student.clone();

        // Assessments keep their own copy of the student, keep the names in sync.
        for assessment in self.data.assessments.values_mut() {
            for s in assessment.students.iter_mut().filter(|s| s.id == student_id) {
                *s = student.clone();
            }
            for se in assessment.student_evaluations.iter_mut().filter(|se| se.student.id == student_id) {
                se.student = student.clone();
            }
        }
        Ok(student)
    }

    pub fn get_students(&self) -> Vec<Student> {
        self.data.students.get_all()
    }

    pub fn delete_student(&mut self, student_id: u32) {
        self.data.students.delete(student_id);
    }

    pub fn create_deck(
        &mut self,
        title: String,
        description: String,
        card_texts: Vec<String>,
    ) -> Deck {
        let mut cards = Vec::new();
        for c_t in card_texts.iter() {
            let card_id = self.get_next_id();
            cards.push(Card::new(card_id, c_t.to_owned(), None));
        }
        let id = self.get_next_id();
        self.data.decks.insert(id, Deck::new(id, title, description, cards))
    }

    /// Adds the sample decks that are not in the app yet, and returns the ones that were added.
    pub fn add_sample_decks(&mut self) -> Vec<Deck> {
        let existing_titles: Vec<String> = self.data.decks.values().map(|d| d.title.clone()).collect();
        samples::SAMPLE_DECKS.iter()
            .filter(|sample| !existing_titles.iter().any(|t| t == sample.title))
            .map(|sample| self.create_deck(
                sample.title.to_string(),
                sample.description.to_string(),
                sample.words.iter().map(|w| w.to_string()).collect(),
            ))
            .collect()
    }

    pub fn get_deck(&mut self, id: u32) -> Result<Deck, String> {
        self.data.decks.get(id).cloned().ok_or("Deck not found".to_string())
    }

    pub fn delete_deck(&mut self, deck_id: u32) {
        if let Some(deck) = self.data.decks.delete(deck_id) {
            for card in deck.cards.iter() {
                self.delete_card_image(card);
            }
        }
    }

    pub fn get_decks(&self) -> Vec<Deck> {
        self.data.decks.get_all()
    }

    pub fn add_card_to_deck(
        &mut self,
        deck_id: u32,
        text: String,
        card_image_file_path: Option<String>,
    ) -> Result<(), String> {
        if self.data.decks.get(deck_id).is_none() {
            return Err("Deck not found".to_string());
        }
        let id = self.get_next_id();
        let image_file_path = card_image_file_path
            .map(|source| store_card_image(&source, deck_id, id))
            .transpose()?;
        if let Some(deck) = self.data.decks.get(deck_id) {
            deck.cards.push(Card::new(id, text, image_file_path));
        }
        Ok(())
    }

    /// Adds many words at once, e.g. pasted from a list. Empty lines are skipped.
    pub fn add_words_to_deck(&mut self, deck_id: u32, words: Vec<String>) -> Result<Vec<Card>, String> {
        if self.data.decks.get(deck_id).is_none() {
            return Err("Deck not found".to_string());
        }
        let mut cards = Vec::new();
        for word in words.iter().map(|w| w.trim()).filter(|w| !w.is_empty()) {
            let id = self.get_next_id();
            cards.push(Card::new(id, word.to_string(), None));
        }
        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        deck.cards.extend(cards.iter().cloned());
        Ok(cards)
    }

    pub fn update_card_text(&mut self, deck_id: u32, card_id: u32, text: String) -> Result<Card, String> {
        let text = text.trim().to_string();
        if text.is_empty() {
            return Err("A word can not be empty".to_string());
        }
        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        let card = deck.cards.iter_mut().find(|c| c.id == card_id).ok_or("Word not found")?;
        card.text = text;
        Ok(card.clone())
    }

    /// Moves a word to another position in the deck, which is the order it is read in.
    pub fn move_card(&mut self, deck_id: u32, card_id: u32, new_index: u32) -> Result<Vec<Card>, String> {
        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        let index = deck.cards.iter().position(|c| c.id == card_id).ok_or("Word not found")?;
        let card = deck.cards.remove(index);
        let new_index = (new_index as usize).min(deck.cards.len());
        deck.cards.insert(new_index, card);
        Ok(deck.cards.clone())
    }

    /// Gives a word a new picture, or removes it when `image_file_path` is `None`.
    pub fn set_card_image(&mut self, deck_id: u32, card_id: u32, image_file_path: Option<String>) -> Result<Card, String> {
        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        if !deck.cards.iter().any(|c| c.id == card_id) {
            return Err("Word not found".to_string());
        }
        let new_image_file_path = image_file_path
            .map(|source| store_card_image(&source, deck_id, card_id))
            .transpose()?;

        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        let card = deck.cards.iter_mut().find(|c| c.id == card_id).ok_or("Word not found")?;
        let old_card = card.clone();
        card.image_file_path = new_image_file_path;
        let card = card.clone();
        self.delete_card_image(&old_card);
        Ok(card)
    }

    pub fn delete_card_from_deck(&mut self, deck_id: u32, card_id: u32) -> Result<u32, String> {
        let deck = self.data.decks.get(deck_id).ok_or("Deck not found")?;
        if let Some(index) = deck.cards.iter().position(|c| c.id == card_id) {
            let card = deck.cards.remove(index);
            self.delete_card_image(&card);
        }
        Ok(card_id)
    }

    /// Removes the card's image from disk, unless an assessment still shows it.
    fn delete_card_image(&self, card: &Card) {
        let Some(image_file_path) = &card.image_file_path else { return };
        let in_use = self.data.assessments.values()
            .flat_map(|a| a.cards.iter())
            .any(|c| c.image_file_path.as_ref() == Some(image_file_path));
        if in_use {
            return;
        }
        if let Err(e) = fs::remove_file(image_file_path) {
            eprintln!("Error deleting card image file: {:?}", e);
        }
    }

    pub fn update_deck(&mut self, deck: Deck) -> Result<(), String> {
        let existing = self.data.decks.get(deck.id).ok_or("Deck not found")?;
        // Only the details are editable here, cards are managed through their own commands.
        existing.title = deck.title;
        existing.description = deck.description;
        Ok(())
    }

    pub fn create_assessment(
        &mut self,
        title: String,
        students: Vec<Student>,
        cards: Vec<Card>,
        duration_in_sec: u32,
    ) -> Result<Assessment, String> {
        if students.is_empty() || cards.is_empty() {
            return Err("An assessment needs at least one student and one card".to_string());
        }
        if duration_in_sec == 0 {
            return Err("The duration must be greater than zero".to_string());
        }
        let candidate = Assessment::new(0, title, students, cards, duration_in_sec);
        if self.data.assessments.values().any(|a| a == &candidate) {
            return Err("An active assessment with the selected students and cards already exists".to_string());
        }
        let id = self.get_next_id();
        let new_assessment = Assessment { id, ..candidate };
        Ok(self.data.assessments.insert(id, new_assessment))
    }

    /// Creates a one-student assessment with every card in the deck, ready to be read.
    pub fn start_reading(&mut self, student_id: u32, deck_id: u32, duration_in_sec: u32, shuffle: bool) -> Result<u32, String> {
        let student = self.get_student(student_id).ok_or("Student not found")?;
        let mut deck = self.get_deck(deck_id)?;
        if shuffle {
            shuffle_cards(&mut deck.cards);
        }
        if deck.cards.is_empty() {
            return Err(format!("The deck \"{}\" does not have any words yet", deck.title));
        }
        if duration_in_sec == 0 {
            return Err("The duration must be greater than zero".to_string());
        }
        let id = self.get_next_id();
        let title = format!("{} - {}", deck.title, Utc::now().format("%Y-%m-%d"));
        self.data.assessments.insert(id, Assessment::new(id, title, vec![student], deck.cards, duration_in_sec));
        Ok(id)
    }

    pub fn copy_assessment(&mut self, assessment_id: u32) -> Result<Assessment, String> {
        let assessment = self.data.assessments.get(assessment_id)
            .ok_or("Assessment not found")?
            .clone();
        self.create_assessment(
            format!("Copy of {}", assessment.title),
            assessment.students,
            assessment.cards,
            assessment.duration_in_sec,
        )
    }

    pub fn get_assessments(&self, include_completed_assessments: bool) -> Vec<Assessment> {
        self.data.assessments.values()
            .filter(|a| include_completed_assessments || a.get_state() != AssessmentState::Completed)
            .cloned().collect()
    }

    pub fn get_assessment(&mut self, id: u32) -> Option<&mut Assessment> {
        self.data.assessments.get(id)
    }

    pub fn delete_assessment(&mut self, id: u32) {
        self.data.assessments.delete(id);
    }

    pub fn get_student_evaluation(
        &mut self,
        assessment_id: u32,
        student_id: u32,
    ) -> Option<&mut StudentEvaluation> {
        self.data.assessments.get(assessment_id)?
            .get_student_evaluation_by_student_id(student_id)
    }

    pub fn reset_student_evaluation(&mut self, assessment_id: u32, student_id: u32) -> Result<StudentEvaluation, String> {
        let se = self.get_student_evaluation(assessment_id, student_id)
            .ok_or("Student evaluation not found")?;
        se.reset_results();
        Ok(se.clone())
    }

    pub fn read_card(&mut self, student_id: u32, assessment_id: u32, wrong: bool) {
        if let Some(se) = self.get_student_evaluation(assessment_id, student_id) {
            se.card_read(wrong);
        }
    }

    pub fn get_student(&mut self, student_id: u32) -> Option<Student> {
        self.data.students.get(student_id).cloned()
    }

    pub fn save(&self, file_path: PathBuf) -> io::Result<()> {
        let json_str = serde_json::to_string(&self.data)?;
        // Write to a temporary file first so a crash halfway through never leaves a truncated data file.
        let tmp_file_path = file_path.with_extension("json.tmp");
        fs::write(&tmp_file_path, json_str)?;
        fs::rename(&tmp_file_path, &file_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_temp_file(name: &str, content: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("wordwizard-test-{}-{}", std::process::id(), name));
        fs::write(&path, content).unwrap();
        path
    }

    fn engine_with_deck(words: &[&str]) -> (Engine, u32) {
        let mut engine = Engine { data: Data::new() };
        let deck = engine.create_deck("Test".into(), String::new(), words.iter().map(|w| w.to_string()).collect());
        (engine, deck.id)
    }

    fn texts(cards: &[Card]) -> Vec<&str> {
        cards.iter().map(|c| c.text.as_str()).collect()
    }

    #[test]
    fn pasted_words_skip_empty_lines() {
        let (mut engine, deck_id) = engine_with_deck(&[]);
        let added = engine.add_words_to_deck(deck_id, vec!["cat".into(), "  ".into(), " dog ".into()]).unwrap();
        assert_eq!(texts(&added), vec!["cat", "dog"]);
        assert_eq!(engine.get_deck(deck_id).unwrap().cards.len(), 2);
    }

    #[test]
    fn words_can_be_moved_and_renamed() {
        let (mut engine, deck_id) = engine_with_deck(&["a", "b", "c"]);
        let c_id = engine.get_deck(deck_id).unwrap().cards[2].id;
        let cards = engine.move_card(deck_id, c_id, 0).unwrap();
        assert_eq!(texts(&cards), vec!["c", "a", "b"]);
        let cards = engine.move_card(deck_id, c_id, 99).unwrap();
        assert_eq!(texts(&cards), vec!["a", "b", "c"]);
        assert_eq!(engine.update_card_text(deck_id, c_id, " cat ".into()).unwrap().text, "cat");
        assert!(engine.update_card_text(deck_id, c_id, "  ".into()).is_err());
    }

    #[test]
    fn shuffle_keeps_every_word() {
        let mut cards: Vec<Card> = (0..30).map(|i| Card::new(i, i.to_string(), None)).collect();
        shuffle_cards(&mut cards);
        let mut ids: Vec<u32> = cards.iter().map(|c| c.id).collect();
        assert_ne!(ids, (0..30).collect::<Vec<u32>>(), "30 words should practically never stay in order");
        ids.sort();
        assert_eq!(ids, (0..30).collect::<Vec<u32>>());
    }

    #[test]
    fn accepts_svg_pictures() {
        let path = write_temp_file("cat.svg", "<?xml version=\"1.0\"?><svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
        assert!(validate_svg(&path).is_ok());
        let upper_case = write_temp_file("CAT.SVG", "<svg></svg>");
        assert!(validate_svg(&upper_case).is_ok());
    }

    #[test]
    fn rejects_other_picture_formats() {
        let path = write_temp_file("cat.png", "<svg></svg>");
        assert_eq!(validate_svg(&path), Err("Only SVG pictures are supported".to_string()));
    }

    #[test]
    fn rejects_files_that_are_not_really_svg() {
        let path = write_temp_file("fake.svg", "just some text");
        assert_eq!(validate_svg(&path), Err("The selected file is not a valid SVG picture".to_string()));
    }
}
