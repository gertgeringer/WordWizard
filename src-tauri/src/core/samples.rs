//! Ready-made word decks, so a teacher can try the app without typing words first.

pub struct SampleDeck {
    pub title: &'static str,
    pub description: &'static str,
    pub words: &'static [&'static str],
}

pub const SAMPLE_DECKS: &[SampleDeck] = &[
    SampleDeck {
        title: "Grade 2 sight words - set 1",
        description: "Dolch second grade sight words, first half",
        words: &[
            "always", "around", "because", "been", "before", "best", "both", "buy",
            "call", "cold", "does", "don't", "fast", "first", "five", "found",
            "gave", "goes", "green", "its", "made", "many", "off",
        ],
    },
    SampleDeck {
        title: "Grade 2 sight words - set 2",
        description: "Dolch second grade sight words, second half",
        words: &[
            "or", "pull", "read", "right", "sing", "sit", "sleep", "tell",
            "their", "these", "those", "upon", "us", "use", "very", "wash",
            "which", "why", "wish", "work", "would", "write", "your",
        ],
    },
    SampleDeck {
        title: "Grade 2 long vowel words",
        description: "Decodable words with long vowel sounds",
        words: &[
            "rain", "play", "cake", "train", "seed", "tree", "leaf", "team",
            "kite", "bike", "night", "light", "boat", "snow", "rope", "coat",
            "cube", "mule", "tune", "blue",
        ],
    },
    SampleDeck {
        title: "Graad 2 Afrikaanse hoëfrekwensiewoorde",
        description: "Algemene woorde wat Graad 2-leerders vinnig moet herken",
        words: &[
            "die", "en", "is", "ek", "het", "nie", "hy", "sy",
            "ons", "hulle", "my", "van", "wat", "was", "met", "kan",
            "sal", "gaan", "kom", "sien", "speel", "baie", "groot", "klein",
            "mooi", "huis", "skool", "vir", "ook", "nou",
        ],
    },
];
