import {Button, Group, Modal, Text, TextInput} from "@mantine/core";
import {IconListDetails, IconPlus} from "@tabler/icons-react";
import DeckCard from "./DeckCard";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import NewCard from "./NewCard";
import AddManyWordsModal from "./AddManyWordsModal";
import {Card, commands} from "../../bindings.ts";
import {message} from "@tauri-apps/api/dialog";
import {useI18n} from "../../i18n";
import {pickSvgPicture} from "../../utils/pictures.ts";

interface DeckCardGridProps {
    deckId: number
    editable?: boolean
}

const DeckCardGrid: React.FC<DeckCardGridProps> = ({ deckId, editable }) => {

    const [opened, { open, close }] = useDisclosure(false);
    const [manyOpened, setManyOpened] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);
    const [editingCard, setEditingCard] = useState<Card>();
    const [editText, setEditText] = useState("");
    const {t} = useI18n();

    const showError = (error: string) => message(error, {title: t("error")});

    const reload = () => {
        commands.getDeck(deckId).then((result) => {
            if (result.status === "ok") {
                setCards(result.data.cards);
            }
        })
    }

    // Reload when the new word dialog closes, so freshly added words show up.
    useEffect(() => {
        if (!opened) {
            reload();
        }
    }, [deckId, opened])

    const setPicture = (card: Card, imageFilePath: string | null) => {
        commands.setCardImage(deckId, card.id, imageFilePath).then((result) => {
            if (result.status === "ok") {
                setCards(cards => cards.map(c => c.id === card.id ? result.data : c));
            } else {
                showError(result.error);
            }
        });
    }

    const move = (card: Card, newIndex: number) => {
        commands.moveCard(deckId, card.id, newIndex).then((result) => {
            if (result.status === "ok") {
                setCards(result.data);
            } else {
                showError(result.error);
            }
        });
    }

    const saveEdit = () => {
        if (!editingCard || editText.trim().length === 0) {
            return;
        }
        commands.updateCardText(deckId, editingCard.id, editText).then((result) => {
            if (result.status === "ok") {
                setCards(cards => cards.map(c => c.id === result.data.id ? result.data : c));
                setEditingCard(undefined);
            } else {
                showError(result.error);
            }
        });
    }

    return (
        <>
            <Group>
                {cards.length === 0 &&
                    <Text c="dimmed">{t("noWordsYet")}</Text>
                }
                {cards.map((card, index) => (
                    <DeckCard
                        key={card.id}
                        text={card.text}
                        editable={editable}
                        cardImagePath={card.image_file_path}
                        onEdit={() => {
                            setEditText(card.text);
                            setEditingCard(card);
                        }}
                        onMoveLeft={index > 0 ? () => move(card, index - 1) : undefined}
                        onMoveRight={index < cards.length - 1 ? () => move(card, index + 1) : undefined}
                        onChoosePicture={() => {
                            pickSvgPicture(t).then(path => path && setPicture(card, path));
                        }}
                        onRemovePicture={() => setPicture(card, null)}
                        onDeleteCardClick={() => {
                            commands.deleteCard(deckId, card.id).then((result) => {
                                if (result.status === "ok") {
                                    setCards(cards => cards.filter(c => c.id !== card.id))
                                } else {
                                    showError(result.error);
                                }
                            })
                    }}/>
                ))}
            </Group>
            {editable &&
                <Group>
                    <Button variant="light" leftSection={<IconPlus size={16}/>} onClick={open}>
                        {t("addWord")}
                    </Button>
                    <Button variant="default" leftSection={<IconListDetails size={16}/>} onClick={() => setManyOpened(true)}>
                        {t("addManyWords")}
                    </Button>
                </Group>
            }
            <NewCard deckId={deckId} opened={opened} close={close} />
            <AddManyWordsModal deckId={deckId} opened={manyOpened} onClose={(added) => {
                setManyOpened(false);
                if (added) {
                    reload();
                }
            }}/>
            <Modal opened={!!editingCard} onClose={() => setEditingCard(undefined)} centered
                   title={<Text fw={700} size="lg">{t("editWord")}</Text>}>
                <form onSubmit={(event) => {
                    event.preventDefault();
                    saveEdit();
                }}>
                    <TextInput data-autofocus size="lg" label={t("word")} value={editText}
                               error={editText.trim().length === 0 ? t("wordRequired") : undefined}
                               onChange={(event) => setEditText(event.currentTarget.value)}/>
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" size="md" disabled={editText.trim().length === 0}>{t("save")}</Button>
                    </Group>
                </form>
            </Modal>
        </>
    );

}

export default DeckCardGrid
