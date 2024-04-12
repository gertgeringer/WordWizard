import { Stack } from "@mantine/core";
import DeckListItem from "./DeckListItem";
import {Deck} from "../../bindings.ts";

interface DeckListProps {
    decks: Deck[]
    onDeckDeleted: (deck: Deck) => void
    editable?: boolean
}

const DeckList: React.FC<DeckListProps> = ({ decks, onDeckDeleted, editable }) => {

    return (
        <Stack h={300} gap="xs" mt={"md"}>
            {decks.map((deck, index) => (
                <DeckListItem
                    editable={editable}
                    key={index}
                    deck={deck}
                    onDeckDeleted={() => onDeckDeleted(deck)}

                />
            ))}
        </Stack>
    )

}

export default DeckList
