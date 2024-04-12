import { Textarea, Group, Button, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import {commands, Deck} from "../../bindings.ts";
import React from "react";

interface EditDeckProps {
    onDeckCreated: (deck: Deck) => void,
    deck?: Deck
}

const EditDeck: React.FC<EditDeckProps> = ({ onDeckCreated, deck }) => {

    const form = useForm({

        initialValues: {
            title: deck ? deck.title : "",
            description: deck ? deck.description : ""
        },

        validate: {
            title: (value) => (value.length === 0 ? 'The deck does not have a title' : null)
        }
    });

    return (
        <>
            <form style={{width: "100%"}} onSubmit={form.onSubmit((form) => {
                if (deck) {
                    deck.title = form.title;
                    deck.description = form.description;
                    commands.updateDeck(deck).then((result) => {
                        if (result.status === "ok") {
                            onDeckCreated(deck);
                        }
                    })
                } else {
                    commands.createDeck(form.title, form.description).then((result) => {
                        if (result.status === "ok") {
                            form.title = '';
                            form.description = ''
                            onDeckCreated(result.data);
                        }
                    });
                }
            })}>
                <TextInput
                    data-autofocus
                    withAsterisk
                    label="Title"
                    {...form.getInputProps('title')}
                />
                <Textarea
                    autosize
                    minRows={4}
                    maxRows={4}
                    label="Description"
                    {...form.getInputProps('description')}
                />

                <Group justify="right" mt="xl">
                    <Button type="submit">
                        {deck ? "Update" : "Create"}
                    </Button>
                </Group>

            </form>
        </>
    )

}

export default EditDeck
