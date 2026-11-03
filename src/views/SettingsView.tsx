import React from "react";
import {MantineColorScheme, Paper, SegmentedControl, Stack, Text, Title, useMantineColorScheme} from "@mantine/core";
import LanguageSelector from "../components/common/LanguageSelector.tsx";
import {useI18n} from "../i18n";
import {BackupButtons, ExportButton} from "../components/settings/DataSettings.tsx";

const SettingsSection: React.FC<{ title: string, description: string, children: React.ReactNode }> = (
    {title, description, children}
) => (
    <Paper withBorder p="lg" radius="md">
        <Stack gap="sm">
            <div>
                <Text fw={600} size="lg">{title}</Text>
                <Text size="sm" c="dimmed">{description}</Text>
            </div>
            {children}
        </Stack>
    </Paper>
);

const SettingsView: React.FC = () => {

    const {t} = useI18n();
    const {colorScheme, setColorScheme} = useMantineColorScheme();

    return (
        <Stack maw={640}>
            <Title order={2}>{t("settingsTitle")}</Title>

            <SettingsSection title={t("language")} description={t("languageHelp")}>
                <LanguageSelector/>
            </SettingsSection>

            <SettingsSection title={t("exportResults")} description={t("exportHelp")}>
                <ExportButton/>
            </SettingsSection>

            <SettingsSection title={t("backupAndRestore")} description={t("backupHelp")}>
                <BackupButtons/>
            </SettingsSection>

            <SettingsSection title={t("appearance")} description={t("appearanceHelp")}>
                <SegmentedControl
                    value={colorScheme}
                    onChange={(value) => setColorScheme(value as MantineColorScheme)}
                    data={[
                        {value: "light", label: t("themeLight")},
                        {value: "dark", label: t("themeDark")},
                        {value: "auto", label: t("themeAuto")},
                    ]}
                />
            </SettingsSection>
        </Stack>
    );
}

export default SettingsView;
