import { Stack } from "@mantine/core";
import React from "react";
import DeckListItem from "./DeckListItem";
import {Deck} from "../../bindings.ts";

interface DeckListProps {
    decks: Deck[]
    onDeckDeleted: (deck: Deck) => void
    onDeckUpdated: (deck: Deck) => void
    editable?: boolean
}

const DeckList: React.FC<DeckListProps> = ({ decks, onDeckDeleted, onDeckUpdated, editable }) => {

    return (
        <Stack gap="xs" mt={"md"}>
            {decks.map((deck) => (
                <DeckListItem
                    editable={editable}
                    key={deck.id}
                    deck={deck}
                    onDeckDeleted={onDeckDeleted}
                    onDeckUpdated={onDeckUpdated}
                />
            ))}
        </Stack>
    )

}

export default DeckList
