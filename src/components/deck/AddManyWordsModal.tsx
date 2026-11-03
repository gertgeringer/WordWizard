import React, {useState} from "react";
import {Button, Group, Modal, Stack, Text, Textarea} from "@mantine/core";
import {message} from "@tauri-apps/api/dialog";
import {commands} from "../../bindings.ts";
import {useI18n} from "../../i18n";

interface AddManyWordsModalProps {
    deckId: number,
    opened: boolean,
    onClose: (added: boolean) => void
}

/** Splits pasted text into words: one per line, commas also work. */
function parseWords(text: string): string[] {
    return text.split(/[\n,;\t]/).map(w => w.trim()).filter(w => w.length > 0);
}

const AddManyWordsModal: React.FC<AddManyWordsModalProps> = ({deckId, opened, onClose}) => {

    const {t} = useI18n();
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const words = parseWords(text);

    const close = (added: boolean) => {
        setText("");
        onClose(added);
    }

    const save = async () => {
        setSaving(true);
        const result = await commands.addWordsToDeck(deckId, words);
        setSaving(false);
        if (result.status === "error") {
            await message(result.error, {title: t("error")});
        } else {
            close(true);
        }
    }

    return (
        <Modal opened={opened} onClose={() => close(false)} centered size="md"
               title={<Text fw={700} size="lg">{t("addManyWords")}</Text>}>
            <Stack>
                <Textarea
                    data-autofocus
                    autosize
                    minRows={8}
                    maxRows={16}
                    label={t("addManyWordsLabel")}
                    description={t("addManyWordsHelp")}
                    placeholder={"cat\ndog\nsun"}
                    value={text}
                    onChange={(event) => setText(event.currentTarget.value)}
                />
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t("words", {count: words.length})}</Text>
                    <Button size="md" disabled={words.length === 0} loading={saving} onClick={save}>
                        {t("addWordsButton", {count: words.length})}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default AddManyWordsModal;
