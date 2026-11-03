import {Student} from "../bindings.ts";
import {Language, TFunction} from "../i18n";

export function getFullName(student: Student): string {
    return student.first_name + " " + student.last_name;
}

export function formatSeconds(milliseconds: number, t: TFunction, language: Language): string {
    const value = (milliseconds / 1000).toLocaleString(language, {minimumFractionDigits: 1, maximumFractionDigits: 1});
    return t("seconds", {value});
}

export function formatDuration(seconds: number, t: TFunction, language: Language): string {
    if (seconds < 60) {
        return t("seconds", {value: seconds});
    }
    const minutes = t("minutes", {value: Math.floor(seconds / 60).toLocaleString(language)});
    return seconds % 60 === 0 ? minutes : minutes + " " + t("seconds", {value: seconds % 60});
}

export function formatDate(epochSeconds: number | undefined, language: Language): string {
    return new Date((epochSeconds ?? 0) * 1000).toLocaleDateString(language, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
