import {Button, Group, Stack, Text, Title} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import DeckList from "../components/deck/DeckList";
import {useDisclosure} from "@mantine/hooks";
import React, {useState, useEffect} from "react";
import EditDeck from "../components/deck/EditDeck";
import {commands, Deck} from "../bindings.ts";
import SideDrawer from "../components/common/SideDrawer.tsx";
import SampleDecksButton from "../components/deck/SampleDecksButton.tsx";
import {useI18n} from "../i18n";

const DecksView: React.FC = () => {

    const [decks, setDecks] = useState<Deck[]>();
    const [opened, {open, close}] = useDisclosure(false);
    const {t} = useI18n();

    useEffect(() => {
        commands.getAllDecks().then(setDecks);
    }, [])

    return (
        <Stack>
            <Group justify="space-between">
                <div>
                    <Title order={2}>{t("decksTitle")}</Title>
                    <Text c="dimmed">{t("decksIntro")}</Text>
                </div>
                <Group>
                    {decks && decks.length > 0 &&
                        <SampleDecksButton size="md" onAdded={added => setDecks(decks => [...(decks ?? []), ...added])}/>
                    }
                    <Button size="md" leftSection={<IconPlus size={18}/>} onClick={open}>
                        {t("newDeck")}
                    </Button>
                </Group>
            </Group>
            {decks && decks.length === 0 &&
                <Stack align="center" py={80} gap="md">
                    <Text size="xl" fw={600}>{t("noDecksTitle")}</Text>
                    <Text c="dimmed" ta="center" maw={420}>{t("noDecksText")}</Text>
                    <Group>
                        <Button size="lg" leftSection={<IconPlus size={20}/>} onClick={open}>
                            {t("createFirstDeck")}
                        </Button>
                        <SampleDecksButton size="lg" onAdded={setDecks}/>
                    </Group>
                </Stack>
            }
            <DeckList
                decks={decks ?? []}
                editable={true}
                onDeckDeleted={(deck) => {
                    setDecks(decks => decks?.filter(d => d.id !== deck.id))
                }}
                onDeckUpdated={(deck) => {
                    setDecks(decks => decks?.map(d => d.id === deck.id ? deck : d))
                }}
            />
            <SideDrawer opened={opened} onClose={close} title={t("newDeck")}>
                <EditDeck onDeckSaved={(deck) => {
                    setDecks(decks => [...(decks ?? []), deck]);
                    close();
                }}/>
            </SideDrawer>
        </Stack>
    );
}

export default DecksView
