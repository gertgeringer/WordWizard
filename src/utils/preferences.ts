// Remembers the teacher's last choices, so starting a reading is usually a single click.
// Storage can be unavailable, in that case the defaults are used.

const LAST_DECK_KEY = "wordwizard.lastDeckId";
const LAST_DURATION_KEY = "wordwizard.lastDurationInSec";
const SHUFFLE_KEY = "wordwizard.shuffle";

export const DEFAULT_DURATION_IN_SEC = 60;

function read(key: string): number | undefined {
    try {
        const raw = localStorage.getItem(key);
        const value = Number(raw);
        return raw !== null && Number.isFinite(value) ? value : undefined;
    } catch {
        return undefined;
    }
}

function write(key: string, value: number) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Not remembering the choice is fine.
    }
}

export function getLastDeckId(studentId: number): number | undefined {
    return read(`${LAST_DECK_KEY}.${studentId}`) ?? read(LAST_DECK_KEY);
}

export function getLastDurationInSec(): number {
    return read(LAST_DURATION_KEY) ?? DEFAULT_DURATION_IN_SEC;
}

const CLASS_FILTER_KEY = "wordwizard.classFilter";

export function getClassFilter(): string | undefined {
    try {
        return localStorage.getItem(CLASS_FILTER_KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

export function rememberClassFilter(classFilter: string) {
    try {
        localStorage.setItem(CLASS_FILTER_KEY, classFilter);
    } catch {
        // Not remembering the choice is fine.
    }
}

export function getLastShuffle(): boolean {
    return read(SHUFFLE_KEY) !== 0;
}

export function rememberReadingChoice(studentId: number, deckId: number, durationInSec: number, shuffle: boolean) {
    write(`${LAST_DECK_KEY}.${studentId}`, deckId);
    write(LAST_DECK_KEY, deckId);
    write(LAST_DURATION_KEY, durationInSec);
    write(SHUFFLE_KEY, shuffle ? 1 : 0);
}
