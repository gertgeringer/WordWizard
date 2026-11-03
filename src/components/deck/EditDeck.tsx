import { Textarea, Group, Button, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import {commands, Deck} from "../../bindings.ts";
import React from "react";
import {message} from "@tauri-apps/api/dialog";
import {useI18n} from "../../i18n";

interface EditDeckProps {
    onDeckSaved: (deck: Deck) => void,
    deck?: Deck
}

const EditDeck: React.FC<EditDeckProps> = ({ onDeckSaved, deck }) => {

    const {t} = useI18n();

    const form = useForm({

        initialValues: {
            title: deck ? deck.title : "",
            description: deck ? deck.description : ""
        },

        validate: {
            title: (value) => (value.trim().length === 0 ? t("deckTitleRequired") : null)
        }
    });

    return (
        <form style={{width: "100%"}} onSubmit={form.onSubmit((values) => {
            const title = values.title.trim();
            const description = values.description.trim();
            if (deck) {
                const updatedDeck = {...deck, title, description};
                commands.updateDeck(updatedDeck).then((result) => {
                    if (result.status === "ok") {
                        onDeckSaved(updatedDeck);
                    } else {
                        message(result.error, {title: t("error")});
                    }
                })
            } else {
                commands.createDeck(title, description).then((result) => {
                    if (result.status === "ok") {
                        onDeckSaved(result.data);
                    } else {
                        message(result.error, {title: t("error")});
                    }
                });
            }
        })}>
            <TextInput
                data-autofocus
                withAsterisk
                label={t("deckTitle")}
                {...form.getInputProps('title')}
            />
            <Textarea
                autosize
                minRows={4}
                maxRows={4}
                label={t("deckDescription")}
                {...form.getInputProps('description')}
            />

            <Group justify="right" mt="xl">
                <Button type="submit">
                    {deck ? t("update") : t("create")}
                </Button>
            </Group>

        </form>
    )

}

export default EditDeck
