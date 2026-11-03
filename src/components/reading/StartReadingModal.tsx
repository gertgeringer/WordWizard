import React, {useEffect, useState} from "react";
import {Badge, Button, Group, Modal, NumberInput, SegmentedControl, Stack, Switch, Text, UnstyledButton} from "@mantine/core";
import {IconCards, IconPlayerPlay} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import {commands, Deck, Student} from "../../bindings.ts";
import {getLastDeckId, getLastDurationInSec, getLastShuffle} from "../../utils/preferences.ts";
import {startReading} from "../../utils/reading.ts";
import {formatDuration} from "../../utils/format.ts";
import classes from "./StartReadingModal.module.css";
import SampleDecksButton from "../deck/SampleDecksButton.tsx";
import {useI18n} from "../../i18n";

const DURATIONS_IN_SEC = [30, 60, 120, 180];
const MIN_DURATION_IN_SEC = 5;
const MAX_DURATION_IN_SEC = 3600;
const CUSTOM = "custom";

interface StartReadingModalProps {
    student?: Student,
    onClose: () => void
}

const StartReadingModal: React.FC<StartReadingModalProps> = ({student, onClose}) => {

    const navigate = useNavigate();
    const {t, language} = useI18n();
    const [decks, setDecks] = useState<Deck[]>();
    const [deckId, setDeckId] = useState<number>();
    const [durationInSec, setDurationInSec] = useState<number>(getLastDurationInSec());
    // A remembered time that is not one of the buttons was typed in by the teacher earlier.
    const [customDuration, setCustomDuration] = useState(!DURATIONS_IN_SEC.includes(durationInSec));
    const [shuffle, setShuffle] = useState(getLastShuffle());
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (!student) {
            return;
        }
        commands.getAllDecks().then((decks) => {
            setDecks(decks);
            const usable = decks.filter(d => d.cards.length > 0);
            const lastDeckId = getLastDeckId(student.id);
            setDeckId(usable.find(d => d.id === lastDeckId)?.id ?? usable[0]?.id);
        });
    }, [student]);

    const durationValid = Number.isInteger(durationInSec)
        && durationInSec >= MIN_DURATION_IN_SEC && durationInSec <= MAX_DURATION_IN_SEC;

    const start = async () => {
        if (!student || deckId === undefined || !durationValid) {
            return;
        }
        setStarting(true);
        const assessmentId = await startReading(student, deckId, durationInSec, shuffle, t);
        setStarting(false);
        if (assessmentId !== undefined) {
            navigate(`/read/${assessmentId}/student/${student.id}`, {state: {deckId, durationInSec, shuffle}});
        }
    }

    return (
        <Modal
            opened={!!student}
            onClose={onClose}
            title={<Text fw={700} size="xl">{t("readingWith", {name: student?.first_name ?? ""})}</Text>}
            size="lg"
            centered
        >
            {decks && decks.length === 0 &&
                <Stack align="center" py="lg">
                    <Text size="lg" ta="center">{t("needDeckFirst", {name: student?.first_name ?? ""})}</Text>
                    <Group>
                        <Button size="md" leftSection={<IconCards size={18}/>} onClick={() => navigate("/decks")}>
                            {t("createDeck")}
                        </Button>
                        <SampleDecksButton size="md" onAdded={(added) => {
                            setDecks(added);
                            setDeckId(added[0]?.id);
                        }}/>
                    </Group>
                </Stack>
            }

            {decks && decks.length > 0 &&
                <Stack gap="lg">
                    <Stack gap="xs">
                        <Text fw={600} size="lg">{t("whichWords")}</Text>
                        {decks.map(deck => {
                            const empty = deck.cards.length === 0;
                            return (
                                <UnstyledButton
                                    key={deck.id}
                                    className={classes.option}
                                    data-selected={deck.id === deckId || undefined}
                                    disabled={empty}
                                    onClick={() => setDeckId(deck.id)}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <div>
                                            <Text fw={600}>{deck.title}</Text>
                                            {deck.description && <Text size="sm" c="dimmed" lineClamp={1}>{deck.description}</Text>}
                                        </div>
                                        <Badge variant="light" color={empty ? "gray" : undefined} size="lg">
                                            {empty ? t("noWordsYet") : t("words", {count: deck.cards.length})}
                                        </Badge>
                                    </Group>
                                </UnstyledButton>
                            );
                        })}
                    </Stack>

                    <Stack gap="xs">
                        <Text fw={600} size="lg">{t("howLong")}</Text>
                        <SegmentedControl
                            size="md"
                            fullWidth
                            value={customDuration ? CUSTOM : String(durationInSec)}
                            onChange={(value) => {
                                setCustomDuration(value === CUSTOM);
                                if (value !== CUSTOM) {
                                    setDurationInSec(Number(value));
                                }
                            }}
                            data={[
                                ...DURATIONS_IN_SEC.map(d => ({value: String(d), label: formatDuration(d, t, language)})),
                                {value: CUSTOM, label: t("customDuration")},
                            ]}
                        />
                        {customDuration &&
                            <NumberInput
                                data-autofocus
                                size="md"
                                label={t("customDurationLabel")}
                                min={MIN_DURATION_IN_SEC}
                                max={MAX_DURATION_IN_SEC}
                                step={10}
                                allowDecimal={false}
                                allowNegative={false}
                                value={durationInSec}
                                onChange={(value) => setDurationInSec(typeof value === "number" ? value : 0)}
                                description={durationValid && durationInSec >= 60 ? formatDuration(durationInSec, t, language) : undefined}
                                error={durationValid ? undefined : t("customDurationInvalid")}
                            />
                        }
                    </Stack>

                    <Switch
                        size="md"
                        checked={shuffle}
                        onChange={(event) => setShuffle(event.currentTarget.checked)}
                        label={t("shuffleWords")}
                        description={t("shuffleWordsHelp")}
                    />

                    <Button
                        size="xl"
                        leftSection={<IconPlayerPlay size={24}/>}
                        disabled={deckId === undefined || !durationValid}
                        loading={starting}
                        onClick={start}
                    >
                        {t("startReading")}
                    </Button>
                </Stack>
            }
        </Modal>
    );
}

export default StartReadingModal;
