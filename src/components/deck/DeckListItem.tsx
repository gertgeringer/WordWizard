import {
    Paper,
    Group,
    Title,
    Text,
    Modal,
    Stack
} from "@mantine/core";
import DeckCardGrid from "./DeckCardGrid";
import EditDeck from "./EditDeck";
import React, {useState} from "react";
import {commands, Deck} from "../../bindings.ts";
import QuickMenu from "../common/QuickMenu.tsx";
import {message} from "@tauri-apps/api/dialog";
import {useI18n} from "../../i18n";

interface DeckListItemProps {
    deck: Deck,
    onDeckDeleted: (deck: Deck) => void,
    onDeckUpdated: (deck: Deck) => void,
    editable?: boolean
}

const DeckListItem: React.FC<DeckListItemProps> = ({ deck, onDeckDeleted, onDeckUpdated, editable }) => {

    const {t} = useI18n();
    const [showEditDeckModal, setShowEditDeckModal] = useState<boolean>(false);

    return (
        <>
            <Paper shadow="xs" p="md">
                <Stack>
                    <Group justify="space-between">
                        <Stack gap="xs">
                            <Title order={4}>{deck.title}</Title>
                            {deck.description &&
                                <Text>
                                    {deck.description}
                                </Text>
                            }
                        </Stack>
                        <QuickMenu
                            item={deck}
                            onDelete={() => {
                                commands.deleteDeck(deck.id).then((result) => {
                                    if (result.status === "ok") {
                                        onDeckDeleted(deck);
                                    } else {
                                        message(result.error, {title: t("error")});
                                    }
                                });
                            }}
                            onEdit={() => setShowEditDeckModal(true)}
                        />
                    </Group>
                    <DeckCardGrid editable={editable} deckId={deck.id}/>
                </Stack>
            </Paper>
            <Modal opened={showEditDeckModal} onClose={() => setShowEditDeckModal(false)} title={t("editDeck")}>
                <EditDeck deck={deck} onDeckSaved={(updatedDeck) => {
                    onDeckUpdated(updatedDeck);
                    setShowEditDeckModal(false);
                }}/>
            </Modal>
        </>
    )
}

export default DeckListItem;
