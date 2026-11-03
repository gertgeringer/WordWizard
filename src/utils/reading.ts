import {message} from "@tauri-apps/api/dialog";
import {commands, Student} from "../bindings.ts";
import {rememberReadingChoice} from "./preferences.ts";
import {TFunction} from "../i18n";

/** Starts a reading for a single student, the assessment behind it is created automatically. */
export async function startReading(student: Student, deckId: number, durationInSec: number, shuffle: boolean, t: TFunction): Promise<number | undefined> {
    const result = await commands.startReading(student.id, deckId, durationInSec, shuffle);
    if (result.status === "error") {
        await message(result.error, {title: t("couldNotStartReading")});
        return undefined;
    }
    rememberReadingChoice(student.id, deckId, durationInSec, shuffle);
    return result.data;
}
