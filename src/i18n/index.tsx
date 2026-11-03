import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import en, {TranslationKey, Translations} from "./en.ts";
import af from "./af.ts";

export const LANGUAGES = {
    en: {label: "English", texts: en},
    af: {label: "Afrikaans", texts: af},
} satisfies Record<string, { label: string, texts: Translations }>;

export type Language = keyof typeof LANGUAGES;
export type TFunction = (key: TranslationKey, values?: Record<string, string | number>) => string;

const LANGUAGE_KEY = "wordwizard.language";

function loadLanguage(): Language {
    try {
        const stored = localStorage.getItem(LANGUAGE_KEY);
        if (stored && stored in LANGUAGES) {
            return stored as Language;
        }
    } catch {
        // Fall back to the default language.
    }
    return "en";
}

interface I18nContextValue {
    language: Language,
    setLanguage: (language: Language) => void,
    t: TFunction,
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {

    const [language, setLanguageState] = useState<Language>(loadLanguage);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((language: Language) => {
        setLanguageState(language);
        try {
            localStorage.setItem(LANGUAGE_KEY, language);
        } catch {
            // The choice is then only kept until the app closes.
        }
    }, []);

    const t = useCallback<TFunction>((key, values) => {
        const text = LANGUAGES[language].texts[key] ?? en[key];
        return text.replace(/\{(\w+)}/g, (match, name) => values?.[name] !== undefined ? String(values[name]) : match);
    }, [language]);

    const value = useMemo(() => ({language, setLanguage, t}), [language, setLanguage, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used inside an I18nProvider");
    }
    return context;
}
