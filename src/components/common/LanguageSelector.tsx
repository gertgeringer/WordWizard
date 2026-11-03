import React from "react";
import {SegmentedControl} from "@mantine/core";
import {Language, LANGUAGES, useI18n} from "../../i18n";

const LanguageSelector: React.FC = () => {

    const {language, setLanguage, t} = useI18n();

    return (
        <SegmentedControl
            aria-label={t("language")}
            value={language}
            onChange={(value) => setLanguage(value as Language)}
            data={Object.entries(LANGUAGES).map(([value, {label}]) => ({value, label}))}
        />
    );
}

export default LanguageSelector;
