//! Backups, restoring them, and exporting results to a spreadsheet.

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use chrono::{TimeZone, Utc};
use rust_xlsxwriter::{Format, Workbook};
use serde::{Deserialize, Serialize};

use crate::core::{Data, Engine};
use crate::core::assessment::{Assessment, StudentEvaluation};
use crate::core::student::ReadResult;
use crate::get_root_file_path;

const BACKUP_VERSION: u32 = 1;

/// Everything in one file, pictures included, so a teacher can keep it on a USB stick or move computers.
#[derive(Serialize, Deserialize)]
struct BackupFile {
    version: u32,
    created: String,
    data: Data,
    /// Picture file name to its base64 encoded content.
    images: BTreeMap<String, String>,
}

fn image_file_name(path: &str) -> Option<String> {
    Path::new(path).file_name().map(|n| n.to_string_lossy().into_owned())
}

pub fn read_result(assessment: &Assessment, se: &StudentEvaluation) -> ReadResult {
    let wrong_words = se.get_wrong_words();
    ReadResult {
        title: assessment.title.clone(),
        eval_date_epoch: se.eval_date_epoch,
        total_cards: assessment.cards.len() as u32,
        total_cards_read: se.get_card_read_count(),
        total_cards_wrong: wrong_words.len() as u32,
        wrong_words,
        accuracy: se.get_accuracy(),
        words_correct_per_minute: se.get_words_correct_per_minute(),
        avg_card_read_time: se.get_avg_card_read_time(),
        total_read_time: se.get_evaluation_time_is_ms(),
    }
}

impl Engine {
    /// The finished readings of a student, newest first.
    pub fn get_read_results(&self, student_id: u32) -> Vec<ReadResult> {
        let mut results: Vec<ReadResult> = self.data.assessments.values()
            .flat_map(|a| a.student_evaluations.iter()
                .filter(|se| se.student.id == student_id && se.result.is_some())
                .map(move |se| read_result(a, se)))
            .collect();
        results.sort_by(|a, b| b.eval_date_epoch.cmp(&a.eval_date_epoch));
        results
    }

    pub fn backup(&self, file_path: &Path) -> Result<(), String> {
        let mut image_paths: Vec<String> = self.data.decks.values()
            .flat_map(|d| d.cards.iter())
            .filter_map(|c| c.image_file_path.clone())
            .collect();
        for mut assessment in self.data.assessments.get_all() {
            image_paths.extend(assessment.image_paths_mut().filter_map(|p| p.clone()));
        }

        let mut images = BTreeMap::new();
        for path in image_paths {
            let Some(name) = image_file_name(&path) else { continue };
            if images.contains_key(&name) {
                continue;
            }
            // A missing picture should not stop the rest of the backup.
            if let Ok(bytes) = fs::read(&path) {
                images.insert(name, BASE64.encode(bytes));
            }
        }

        let backup = BackupFile {
            version: BACKUP_VERSION,
            created: Utc::now().to_rfc3339(),
            data: self.data.clone(),
            images,
        };
        let json = serde_json::to_string(&backup).map_err(|e| e.to_string())?;
        fs::write(file_path, json).map_err(|e| format!("Unable to write the backup: {}", e))
    }

    /// Replaces all data with the backup. The current data is backed up first, just in case.
    pub fn restore(&mut self, file_path: &Path) -> Result<(), String> {
        let content = fs::read_to_string(file_path).map_err(|e| format!("Unable to read the backup: {}", e))?;
        let backup: BackupFile = serde_json::from_str(&content)
            .map_err(|_| "This file is not a WordWizard backup".to_string())?;
        if backup.version > BACKUP_VERSION {
            return Err("This backup was made by a newer version of WordWizard".to_string());
        }

        let safety_dir = get_root_file_path().join("backups");
        fs::create_dir_all(&safety_dir).map_err(|e| e.to_string())?;
        self.backup(&safety_dir.join(format!("before-restore-{}.json", Utc::now().format("%Y-%m-%d-%H%M%S"))))?;

        let image_dir = get_root_file_path().join("media").join("cards").join("images");
        fs::create_dir_all(&image_dir).map_err(|e| e.to_string())?;
        for (name, encoded) in backup.images.iter() {
            let bytes = BASE64.decode(encoded).map_err(|e| e.to_string())?;
            // Only use the file name, a backup must never write outside the pictures folder.
            let Some(name) = image_file_name(name) else { continue };
            fs::write(image_dir.join(name), bytes).map_err(|e| e.to_string())?;
        }

        // Pictures were stored with this computer's folder, point them to where they are now.
        let mut data = backup.data;
        let relocate = |path: &mut Option<String>| {
            if let Some(name) = path.as_deref().and_then(image_file_name) {
                *path = Some(image_dir.join(name).to_string_lossy().into_owned());
            }
        };
        for deck in data.decks.values_mut() {
            deck.cards.iter_mut().for_each(|c| relocate(&mut c.image_file_path));
        }
        for assessment in data.assessments.values_mut() {
            assessment.image_paths_mut().for_each(relocate);
        }
        self.data = data;
        Ok(())
    }

    /// Writes every finished reading to an Excel file. `headers` are the column titles in the teacher's language.
    pub fn export_results(&self, file_path: &Path, headers: Vec<String>) -> Result<u32, String> {
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        let bold = Format::new().set_bold();
        let xlsx_error = |e: rust_xlsxwriter::XlsxError| e.to_string();

        for (col, header) in headers.iter().enumerate() {
            sheet.write_string_with_format(0, col as u16, header, &bold).map_err(xlsx_error)?;
        }

        let mut rows: Vec<(String, String, String, ReadResult)> = Vec::new();
        for assessment in self.data.assessments.values() {
            for se in assessment.student_evaluations.iter().filter(|se| se.result.is_some()) {
                // Use the current student details, the class may have been set after the reading.
                let student = self.data.students.values().find(|s| s.id == se.student.id).unwrap_or(&se.student);
                rows.push((student.class_name.clone(), student.first_name.clone(), student.last_name.clone(),
                           read_result(assessment, se)));
            }
        }
        rows.sort_by(|a, b| (&a.0, &a.2, &a.1, a.3.eval_date_epoch).cmp(&(&b.0, &b.2, &b.1, b.3.eval_date_epoch)));

        for (i, (class_name, first_name, last_name, r)) in rows.iter().enumerate() {
            let row = i as u32 + 1;
            let date = Utc.timestamp_opt(r.eval_date_epoch as i64, 0).single()
                .map(|d| d.format("%Y-%m-%d").to_string())
                .unwrap_or_default();
            let texts = [class_name, first_name, last_name, &date, &r.title];
            for (col, text) in texts.iter().enumerate() {
                sheet.write_string(row, col as u16, text.as_str()).map_err(xlsx_error)?;
            }
            let numbers = [
                r.total_cards as f64,
                r.total_cards_read as f64,
                r.total_cards_wrong as f64,
                r.accuracy as f64,
                r.words_correct_per_minute as f64,
                (r.avg_card_read_time as f64 / 100.0).round() / 10.0,
                (r.total_read_time as f64 / 100.0).round() / 10.0,
            ];
            for (col, number) in numbers.iter().enumerate() {
                sheet.write_number(row, (texts.len() + col) as u16, *number).map_err(xlsx_error)?;
            }
            sheet.write_string(row, (texts.len() + numbers.len()) as u16, r.wrong_words.join(", ")).map_err(xlsx_error)?;
        }

        sheet.autofit();
        workbook.save(file_path).map_err(|e| format!("Unable to save the spreadsheet: {}", e))?;
        Ok(rows.len() as u32)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_and_export_write_files() {
        let mut engine = Engine { data: Data::new() };
        let student = engine.create_student("Sam".into(), "Test".into(), "2A".into());
        let deck = engine.create_deck("Words".into(), String::new(), vec!["cat".into(), "dog".into()]);
        let assessment_id = engine.start_reading(student.id, deck.id, 60, false).unwrap();
        let se = engine.get_student_evaluation(assessment_id, student.id).unwrap();
        se.start();
        se.get_current_card();
        se.card_read(false);
        se.get_current_card();
        se.card_read(true);
        se.stop().unwrap();

        let results = engine.get_read_results(student.id);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].wrong_words, vec!["dog".to_string()]);
        assert_eq!(results[0].accuracy, 50);

        let dir = std::env::temp_dir().join(format!("wordwizard-backup-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();

        let backup_path = dir.join("backup.json");
        engine.backup(&backup_path).unwrap();
        let backup: BackupFile = serde_json::from_str(&fs::read_to_string(&backup_path).unwrap()).unwrap();
        assert_eq!(backup.version, BACKUP_VERSION);
        assert_eq!(backup.data.students.get_all().len(), 1);

        let export_path = dir.join("results.xlsx");
        let rows = engine.export_results(&export_path, vec!["Class".into(), "First name".into()]).unwrap();
        assert_eq!(rows, 1);
        assert!(fs::metadata(&export_path).unwrap().len() > 0);
    }
}
