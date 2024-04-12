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
import {useState} from "react";
import {commands, Deck} from "../../bindings.ts";
import QuickMenu from "../common/QuickMenu.tsx";

interface DeckListItemProps {
    deck: Deck,
    onDeckDeleted: (deck: Deck) => void,
    editable?: boolean
}

interface EditDeckDetailsModalProps {
    show: boolean,
    deck: Deck,
    onClose: () => void
}

const EditDeckDetailsModal: React.FC<EditDeckDetailsModalProps> = ({show, deck, onClose}) => {
    return (
        <Modal opened={show} onClose={onClose}>
            <EditDeck deck={deck} onDeckCreated={onClose} />
        </Modal>
    )
}

const DeckListItem: React.FC<DeckListItemProps> = ({ deck, onDeckDeleted, editable }) => {

    const [showEditDeckModal, setShowEditDeckModal] = useState<boolean>(false);

    return (
        <>
            <Paper shadow="xs" p="md">
                <Stack>
                    <Group justify="space-between">
                        <Group>
                            <Stack>
                                <Title order={4}>{deck.title}</Title>
                                <Text>
                                    {deck.description}
                                </Text>
                            </Stack>
                        </Group>
                        <QuickMenu
                            item={deck}
                            onDelete={(item) => {
                                commands.deleteDeck(item.id).then(() => {
                                    onDeckDeleted(item);
                                });
                            }}
                            onEdit={() => {
                                setShowEditDeckModal(visible => !visible);
                            }}
                        />
                    </Group>
                    <DeckCardGrid editable={editable} deckId={deck.id}/>
                </Stack>
            </Paper>
            <EditDeckDetailsModal show={showEditDeckModal} deck={deck} onClose={() => {
                setShowEditDeckModal(false);
            }}/>
        </>
    )
}

export default DeckListItem;