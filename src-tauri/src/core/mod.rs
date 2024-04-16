use std::{fs, io};
use std::fs::File;
use std::io::{ErrorKind, Read, Write};
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::core::assessment::{Assessment, StudentEvaluation};
use crate::core::deck::{Card, Deck};
use crate::core::student::Student;
use crate::get_root_file_path;

use self::store::InMemoryStore;

mod store;
pub mod assessment;
pub mod deck;
pub mod student;

#[derive(Serialize, Deserialize)]
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
        match File::open(file_path) {
            Ok(mut file) => {
                let mut content = String::new();
                file.read_to_string(&mut content)
                    .expect("Unable to read the file");
                let data: Data = serde_json::from_str(&content)
                    .expect("Error deserializing JSON");
                data
            }
            Err(ref e) if e.kind() == ErrorKind::NotFound => {
                Data::new()
            }
            Err(e) => {
                Err(e).unwrap()
            }
        }
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

    pub fn create_student(&mut self, first_name: String, last_name: String) -> Student {
        let id = self.get_next_id();
        let new_student = self.data.students
            .insert(id, Student::new(id, first_name, last_name));
        new_student
    }

    pub fn update_student(
        &mut self,
        student_id: u32,
        first_name: String,
        last_name: String,
    ) -> &mut Student {
        let student = self.data.students.get(student_id).unwrap();
        student.first_name = first_name;
        student.last_name = last_name;
        student
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
        let new_deck = Deck::new(id, title, description, cards);
        self.data.decks.insert(id, new_deck.clone());
        new_deck
    }

    pub fn get_deck(&mut self, id: u32) -> &mut Deck {
        self.data.decks.get(id).unwrap()
    }

    pub fn delete_deck(&mut self, deck_id: u32) {
        let mut cards: Vec<u32> = vec![];
        if let Some(deck) = self.data.decks.get(deck_id) {
            for card in deck.cards.iter() {
                cards.push(card.id);
            }
        }
        for card_id in cards.iter() {
            self.delete_card_from_deck(deck_id, card_id.clone());
        }
        self.data.decks.delete(deck_id);
    }

    pub fn get_decks(&self) -> Vec<Deck> {
        self.data.decks.get_all()
    }

    pub fn add_card_to_deck(&mut self, deck_id: u32, text: String, card_image_file_path: Option<String>) {
        let id = self.get_next_id();
        let mut image_file_path = Option::None;
        if let Some(file_path) = card_image_file_path {
            let source = file_path.clone();
            let ext = std::path::Path::new(&source)
                .extension()
                .and_then(std::ffi::OsStr::to_str)
                .unwrap();
            let destination_dir = format!("{}/media/cards/images", get_root_file_path().to_str().unwrap());
            fs::create_dir_all(&destination_dir).unwrap();
            let destination = format!("{}/{}.{}.{}", destination_dir, deck_id, id, ext);
            fs::copy(&source, &destination).unwrap();
            image_file_path = Option::Some(destination);
        }
        if let Some(deck) = self.data.decks.get(deck_id) {
            deck.cards.push(Card::new(id, text, image_file_path));
        }
    }

    pub fn delete_card_from_deck(&mut self, deck_id: u32, card_id: u32) -> u32 {
        let card_to_delete = self.data.decks.get(deck_id).unwrap()
            .cards.iter().find(|c| c.id == card_id);
        if let Some(card) = card_to_delete {
            if let Some(image_file_path) = card.image_file_path.clone() {
                match fs::remove_file(image_file_path) {
                    Ok(_) => {}
                    Err(e) => println!("Error deleting card image file: {:?}", e)
                }
            }
            if let Some(deck) = self.data.decks.get(deck_id) {
                deck.cards.retain(|c| c.id != card_id);
            }
        }
        card_id
    }

    pub fn update_deck(&mut self, deck: Deck) {
        self.data.decks.insert(deck.id, deck.clone());
    }

    pub fn create_assessment(
        &mut self,
        title: String,
        students: Vec<Student>,
        cards: Vec<Card>,
        duration_in_sec: u32,
    ) -> Result<Assessment, String> {
        let id = self.get_next_id();
        let new_assessment = Assessment::new(id, title, students, cards, duration_in_sec);
        let assessment_exists = self.data.assessments.get_all().iter().find(|a| a == &&new_assessment).is_none();
        if assessment_exists {
            self.data.assessments.insert(id, new_assessment.clone());
            Ok(new_assessment)
        } else {
            Err("An active assessment with the selected students and cards already exists".to_string())
        }
    }

    pub fn copy_assessment(&mut self, assessment_id: u32) -> Result<Assessment, String> {
        let id = self.get_next_id();
        if let Some(assessment) = self.data.assessments.get(assessment_id) {
            let new_assessment = Assessment::new(
                id,
                format!("Copy of {}", assessment.title),
                assessment.students.clone(),
                assessment.cards.clone(),
                assessment.duration_in_sec,
            );
            let assessment_exists = self.data.assessments.get_all().iter().find(|a| a == &&new_assessment).is_none();
            if assessment_exists {
                self.data.assessments.insert(id, new_assessment.clone());
                Ok(new_assessment)
            } else {
                Err("An active assessment with the selected students and cards already exists".to_string())
            }
        } else {
            Err("Assessment not found".to_string())
        }
    }

    pub fn get_assessments(&self, include_completed_assessments: bool) -> Vec<Assessment> {
        self.data.assessments.get_all().iter()
            .filter(|a| include_completed_assessments || a.get_state() != assessment::AssessmentState::Completed)
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
        if let Some(assessment) = self.data.assessments.get(assessment_id) {
            if let Some(se) = assessment
                .student_evaluations
                .iter_mut()
                .find(|s| s.student.get_id() == student_id)
            {
                return Option::from(se);
            }
        }
        Option::None
    }

    pub fn reset_student_evaluation(&mut self, assessment_id: u32, student_id: u32) -> Result<StudentEvaluation, String> {
        if let Some(assessment) = self.data.assessments.get(assessment_id) {
            if let Some(se) = assessment.get_student_evaluation_by_student_id(student_id) {
                se.reset_results();
                return Ok(se.clone());
            }
        }
        Err("Student evaluation not found".to_string())
    }

    pub fn read_card(&mut self, student_id: u32, assessment_id: u32) {
        if let Some(assessment) = self.data.assessments.get(assessment_id) {
            if let Some(se) = assessment.get_student_evaluation_by_student_id(student_id) {
                se.card_read();
            }
        }
    }

    pub fn get_student_evaluation_results(&mut self, student: Student) -> Vec<i32> {
        let mut result = Vec::new();
        for eval in self.data.assessments.get_all().iter() {
            for student_eval in eval.student_evaluations.iter() {
                if let Some(student_eval_result) = student_eval.clone().result {
                    if student_eval.student.get_id() == student.get_id() && student_eval_result.cards_read_count > 0 {
                        let stats = student_eval_result.evaluation_time_in_ms as i32 / student_eval_result.cards_read_count as i32;
                        result.push(stats)
                    }
                }
            }
        }
        result
    }

    pub fn get_student(&mut self, student_id: u32) -> Student {
        self.data.students.get(student_id).unwrap().clone()
    }

    pub fn save(&mut self, file_path: PathBuf) -> io::Result<()> {
        let json_str = serde_json::to_string(&self.data)?;
        let mut file = File::create(file_path)?;
        file.write_all(json_str.as_bytes())?;
        Ok(())
    }
}