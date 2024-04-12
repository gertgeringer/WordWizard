use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct InMemoryStore<T: Clone> {
    data: HashMap<u32, T>,
}

impl<T: Clone> InMemoryStore<T> {
    pub fn new() -> Self {
        InMemoryStore {
            data: HashMap::new(),
        }
    }

    pub fn insert(&mut self, id: u32, value: T) -> T {
        self.data.insert(id, value.clone());
        value
    }

    pub fn get(&mut self, id: u32) -> Option<&mut T> {
        self.data.get_mut(&id)
    }

    pub fn delete(&mut self, id: u32) -> Option<T> {
        self.data.remove(&id)
    }

    pub fn get_all(&self) -> Vec<T> {
        self.data.values().cloned().collect()
    }

}