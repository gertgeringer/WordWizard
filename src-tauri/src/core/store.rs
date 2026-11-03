use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
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

    /// Returns all values ordered by id, which is also the order they were created in.
    pub fn get_all(&self) -> Vec<T> {
        self.values().cloned().collect()
    }

    pub fn values(&self) -> impl Iterator<Item = &T> {
        let mut ids: Vec<&u32> = self.data.keys().collect();
        ids.sort();
        ids.into_iter().map(|id| &self.data[id])
    }

    pub fn values_mut(&mut self) -> impl Iterator<Item = &mut T> {
        self.data.values_mut()
    }
}
