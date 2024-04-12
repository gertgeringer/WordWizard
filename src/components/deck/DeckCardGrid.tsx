import {Group, Title} from "@mantine/core";
import DeckCard from "./DeckCard";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import NewCard from "./NewCard";
import AddButton from "../common/AddButton.tsx";
import {Card, commands} from "../../bindings.ts";
import NoContentMessage from "../common/NoContentMessage.tsx";

interface DeckCardGridProps {
    deckId: number
    editable?: boolean
}

const DeckCardGrid: React.FC<DeckCardGridProps> = ({ deckId, editable }) => {

    const [opened, { open, close }] = useDisclosure(false);
    const [cards, setCards] = useState<Card[]>([]);

    useEffect(() => {
        commands.getDeck(deckId).then((deck) => setCards(deck.cards))
    }, [opened])

    return (
        <>
            <Group justify={"space-between"}>
                <Title order={4} m={"xs"}>Cards</Title>
                <AddButton onClick={open}/>
            </Group>
            <Group>
                {cards && cards.length === 0 &&
                    <NoContentMessage listType={"Cards"} addClick={() => {
                        open()
                    }} />
                }
                {cards && cards.map((card, index) => (
                    <DeckCard
                        key={index}
                        text={card.text}
                        editable={editable}
                        cardImagePath={card.image_file_path}
                        onDeleteCardClick={() => {
                            commands.deleteCard(deckId, card.id).then(() => {
                                setCards(cards => cards.filter(c => c.id !== card.id))
                            })
                    }}/>
                ))}
            </Group>
            <NewCard deckId={deckId} opened={opened} close={close} />
        </>
    );

}

export default DeckCardGrid