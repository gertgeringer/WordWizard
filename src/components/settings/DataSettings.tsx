import React, {useState} from "react";
import {Button, Group} from "@mantine/core";
import {IconDatabaseExport, IconDatabaseImport, IconFileSpreadsheet} from "@tabler/icons-react";
import {ask, message, open, save} from "@tauri-apps/api/dialog";
import {commands} from "../../bindings.ts";
import {useI18n} from "../../i18n";
import {TranslationKey} from "../../i18n/en.ts";

// The order matches the columns the backend writes.
const EXPORT_COLUMNS: TranslationKey[] = [
    "exportClass", "firstName", "lastName", "columnDate", "columnDeck", "exportWords", "wordsRead",
    "exportWordsWrong", "exportAccuracy", "wordsCorrectPerMinute", "exportSecondsPerWord",
    "exportTotalSeconds", "wrongWords",
];

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

export const BackupButtons: React.FC = () => {

    const {t} = useI18n();
    const [busy, setBusy] = useState(false);

    const backup = async () => {
        const filePath = await save({
            defaultPath: `WordWizard backup ${today()}.json`,
            filters: [{name: t("backupFiles"), extensions: ["json"]}],
        });
        if (!filePath) {
            return;
        }
        setBusy(true);
        const result = await commands.backupData(filePath);
        setBusy(false);
        await message(result.status === "ok" ? t("backupDone") : result.error,
            {title: result.status === "ok" ? t("backup") : t("error")});
    }

    const restore = async () => {
        const filePath = await open({multiple: false, filters: [{name: t("backupFiles"), extensions: ["json"]}]});
        if (typeof filePath !== "string") {
            return;
        }
        const confirmed = await ask(t("restoreConfirm"), {title: t("restore"), type: "warning"});
        if (!confirmed) {
            return;
        }
        setBusy(true);
        const result = await commands.restoreData(filePath);
        setBusy(false);
        if (result.status === "error") {
            await message(result.error, {title: t("error")});
            return;
        }
        await message(t("restoreDone"), {title: t("restore")});
        // Every page loads its data on start, so reloading shows the restored data everywhere.
        window.location.assign("/students");
    }

    return (
        <Group>
            <Button variant="default" leftSection={<IconDatabaseExport size={18}/>} onClick={backup} disabled={busy}>
                {t("backup")}
            </Button>
            <Button variant="default" leftSection={<IconDatabaseImport size={18}/>} onClick={restore} disabled={busy}>
                {t("restore")}
            </Button>
        </Group>
    );
}

export const ExportButton: React.FC = () => {

    const {t} = useI18n();
    const [busy, setBusy] = useState(false);

    const exportResults = async () => {
        const filePath = await save({
            defaultPath: `WordWizard ${t("exportFileName")} ${today()}.xlsx`,
            filters: [{name: t("spreadsheetFiles"), extensions: ["xlsx"]}],
        });
        if (!filePath) {
            return;
        }
        setBusy(true);
        const result = await commands.exportResults(filePath, EXPORT_COLUMNS.map(column => t(column)));
        setBusy(false);
        await message(result.status === "ok" ? t("exportDone", {count: result.data}) : result.error,
            {title: result.status === "ok" ? t("exportResults") : t("error")});
    }

    return (
        <Group>
            <Button variant="default" leftSection={<IconFileSpreadsheet size={18}/>} onClick={exportResults} loading={busy}>
                {t("exportResults")}
            </Button>
        </Group>
    );
}
