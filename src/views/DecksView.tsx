import { Group, Title } from "@mantine/core";
import DeckList from "../components/deck/DeckList";
import { useDisclosure } from "@mantine/hooks";
import React, { useState, useEffect } from "react";
import EditDeck from "../components/deck/EditDeck";
import NoContentMessage from "../components/common/NoContentMessage.tsx";
import AddButton from "../components/common/AddButton.tsx";
import {commands, Deck} from "../bindings.ts";
import ViewPage from "../components/common/ViewPage.tsx";
import SideDrawer from "../components/common/SideDrawer.tsx";

const DecksView: React.FC = () => {

    const [decks, setDecks] = useState<Deck[]>([]);
    const [opened, {open, close}] = useDisclosure(false);

    useEffect(() => {
        commands.getAllDecks().then(setDecks);
    }, [])

    return (
        <ViewPage>
            <Group justify="space-between">
                <Title order={3} size="h2" m={"xs"}>📇 DECKS</Title>
                <AddButton onClick={open}/>
            </Group>
            {decks.length == 0 &&
                <NoContentMessage listType={"Decks"} addClick={open}/>
            }
            <DeckList decks={decks} editable={true} onDeckDeleted={(deck) => {
                setDecks(decks => decks.filter(d => d.id !== deck.id))
            }}/>
            <SideDrawer opened={opened} onClose={close} title="New Deck">
                <EditDeck onDeckCreated={(deck) => {
                    setDecks(decks => [...decks, deck]);
                    close();
                }}/>
            </SideDrawer>
        </ViewPage>
    );
}

export default DecksView