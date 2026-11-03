import {ReadResult} from "../bindings.ts";

export interface Trend {
    kind: "better" | "worse" | "same",
    /** How many more (or fewer) words were read correctly per minute, always positive. */
    difference: number,
}

/**
 * Compares the words read correctly per minute with the reading before. This also catches
 * a student who reads faster but makes more mistakes, unlike comparing speed alone.
 */
export function getTrend(current?: ReadResult, previous?: ReadResult): Trend | undefined {
    if (!current || !previous || current.total_cards_read === 0 || previous.total_cards_read === 0) {
        return undefined;
    }
    const difference = current.words_correct_per_minute - previous.words_correct_per_minute;
    if (difference === 0) {
        return {kind: "same", difference: 0};
    }
    return {kind: difference > 0 ? "better" : "worse", difference: Math.abs(difference)};
}

/** The words a student most often reads wrong, most frequent first. */
export function getWordsToPractise(results: ReadResult[], limit = 10): { word: string, count: number }[] {
    const counts = new Map<string, number>();
    for (const result of results) {
        for (const word of result.wrong_words) {
            counts.set(word, (counts.get(word) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .map(([word, count]) => ({word, count}))
        .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
        .slice(0, limit);
}
