import React, {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Badge, Box, Button, Center, Group, Image, Paper, Progress, SimpleGrid, Stack, Text, Title} from "@mantine/core";
import {useHotkeys, useInterval} from "@mantine/hooks";
import {IconArrowLeft, IconArrowRight, IconPlayerPlay, IconPlayerStop, IconRefresh, IconX} from "@tabler/icons-react";
import {convertFileSrc} from "@tauri-apps/api/tauri";
import {message} from "@tauri-apps/api/dialog";
import "./ReadingView.css";
import {Assessment, CardEvaluation, commands, ReadResult, Student} from "../bindings.ts";
import {formatDuration, formatSeconds} from "../utils/format.ts";
import {startReading} from "../utils/reading.ts";
import {useI18n} from "../i18n";
import {getTrend} from "../utils/trend.ts";

type Phase = "loading" | "ready" | "reading" | "saving" | "done";

interface ReadingChoice {
    deckId: number,
    durationInSec: number,
    shuffle: boolean
}

interface Results {
    current: ReadResult,
    previous?: ReadResult
}

const ReadingView: React.FC<{ assessmentId: number, studentId: number }> = ({assessmentId, studentId}) => {

    const navigate = useNavigate();
    const {t, language} = useI18n();
    const choice = useLocation().state as ReadingChoice | null;

    const [phase, setPhase] = useState<Phase>("loading");
    const [assessment, setAssessment] = useState<Assessment>();
    const [student, setStudent] = useState<Student>();
    const [activeCard, setActiveCard] = useState<CardEvaluation>();
    const [cardNumber, setCardNumber] = useState(1);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [results, setResults] = useState<Results>();

    // Guards against double clicks and the timer running out while a word is being saved.
    const busy = useRef(false);
    const finished = useRef(false);
    const endTime = useRef(0);

    useEffect(() => {
        commands.getAssessment(assessmentId).then((result) => {
            if (result.status === "error") {
                message(result.error, {title: t("error")}).then(() => navigate("/students"));
                return;
            }
            setAssessment(result.data);
            setStudent(result.data.students.find(s => s.id === studentId));
            setSecondsLeft(result.data.duration_in_sec);
            setPhase("ready");
        });
    }, [assessmentId, studentId]);

    const timer = useInterval(() => {
        const left = Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left === 0) {
            finish();
        }
    }, 200);

    useEffect(() => timer.stop, []);

    const start = () => {
        if (phase !== "ready" || busy.current) {
            return;
        }
        busy.current = true;
        commands.startEvaluation(assessmentId, studentId).then((result) => {
            if (result.status === "error" || !result.data) {
                message(result.status === "error" ? result.error : t("noWordsLeft"), {title: t("error")});
                return;
            }
            setActiveCard(result.data.active_card);
            endTime.current = Date.now() + result.data.card_read_duration_in_sec * 1000;
            timer.start();
            setPhase("reading");
        }).finally(() => busy.current = false);
    }

    const next = (wrong: boolean) => {
        if (phase !== "reading" || busy.current || finished.current) {
            return;
        }
        busy.current = true;
        commands.cardReadEnd(studentId, assessmentId, wrong).then(nextCard => {
            busy.current = false;
            if (nextCard) {
                setActiveCard(nextCard);
                setCardNumber(n => n + 1);
            } else {
                finish();
            }
        });
    }

    // Called from the timer too, which holds on to an old render, so only rely on refs here.
    const finish = async () => {
        if (finished.current) {
            return;
        }
        finished.current = true;
        timer.stop();
        setPhase("saving");
        const stopped = await commands.stopEvaluation(assessmentId, studentId);
        if (stopped.status === "error") {
            await message(stopped.error, {title: t("error")});
        }
        const readResults = await commands.getStudentsReadResults(studentId);
        if (readResults.status === "ok" && readResults.data.results.length > 0) {
            const [current, previous] = readResults.data.results;
            setResults({current, previous});
        }
        setPhase("done");
    }

    const cancel = async () => {
        // Nothing was read yet, so the reading can be thrown away.
        await commands.deleteAssessment(assessmentId);
        navigate("/students");
    }

    const readAgain = async () => {
        if (!student || !choice) {
            return;
        }
        const newAssessmentId = await startReading(student, choice.deckId, choice.durationInSec, choice.shuffle, t);
        if (newAssessmentId !== undefined) {
            navigate(`/read/${newAssessmentId}/student/${student.id}`, {state: choice, replace: true});
        }
    }

    useHotkeys([
        ["ArrowRight", () => phase === "ready" ? start() : next(false)],
        ["Space", () => phase === "ready" ? start() : next(false)],
        ["X", () => next(true)],
    ]);

    const blurAfter = (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
        // Otherwise pressing space would also click the focused button.
        event.currentTarget.blur();
        action();
    }

    const totalCards = assessment?.cards.length ?? 0;
    const duration = assessment?.duration_in_sec ?? 0;

    return (
        <Box h="100vh" p="xl" style={{display: "flex", flexDirection: "column"}}>
            {phase === "ready" && assessment &&
                <>
                    <Group>
                        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={18}/>} onClick={cancel}>
                            {t("cancel")}
                        </Button>
                    </Group>
                    <Center style={{flexGrow: 1}}>
                        <Stack align="center" gap="xl">
                            <Title order={1} ta="center">{t("areYouReady", {name: student?.first_name ?? ""})}</Title>
                            <Text size="xl" c="dimmed" ta="center">
                                {t("words", {count: totalCards})} &middot; {formatDuration(duration, t, language)}
                            </Text>
                            <Button size="xl" h={80} px={60} leftSection={<IconPlayerPlay size={32}/>}
                                    onClick={blurAfter(start)}>
                                <Text fz={28} fw={700}>{t("start")}</Text>
                            </Button>
                            <Text c="dimmed" ta="center" maw={460}>{t("readingInstructions")}</Text>
                        </Stack>
                    </Center>
                </>
            }

            {(phase === "reading" || phase === "saving") && activeCard &&
                <>
                    <Group justify="space-between" wrap="nowrap">
                        <Text size="lg" fw={600}>{t("wordXOfY", {name: student?.first_name ?? "", number: cardNumber, total: totalCards})}</Text>
                        <Group wrap="nowrap">
                            <Stack gap={4} w={200}>
                                <Text size="lg" fw={700} ta="right" c={secondsLeft <= 10 ? "red" : undefined}>
                                    {t("secondsLeft", {seconds: secondsLeft})}
                                </Text>
                                <Progress value={duration ? secondsLeft / duration * 100 : 0}
                                          color={secondsLeft <= 10 ? "red" : undefined}/>
                            </Stack>
                            <Button variant="default" leftSection={<IconPlayerStop size={18}/>}
                                    onClick={blurAfter(finish)} disabled={phase === "saving"}>
                                {t("stop")}
                            </Button>
                        </Group>
                    </Group>
                    <Center style={{flexGrow: 1}}>
                        <Stack align="center" gap="xl">
                            {activeCard.card.image_file_path &&
                                <Image radius="md" mah="30vh" w="auto" fit="contain"
                                       src={convertFileSrc(activeCard.card.image_file_path)}/>
                            }
                            <div
                                className="reading-word"
                                data-with-image={activeCard.card.image_file_path ? true : undefined}
                                style={{"--word-length": Math.max(activeCard.card.text.length, 2)} as React.CSSProperties}
                            >
                                {activeCard.card.text}
                            </div>
                        </Stack>
                    </Center>
                    <Group justify="center" gap="xl">
                        <Button size="xl" h={80} px={40} variant="outline" color="red" leftSection={<IconX size={32}/>}
                                onClick={blurAfter(() => next(true))} disabled={phase === "saving"}>
                            <Text fz={28} fw={700}>{t("wrongWord")}</Text>
                        </Button>
                        <Button size="xl" h={80} px={60} rightSection={<IconArrowRight size={32}/>}
                                onClick={blurAfter(() => next(false))} loading={phase === "saving"}>
                            <Text fz={28} fw={700}>{t("nextWord")}</Text>
                        </Button>
                    </Group>
                </>
            }

            {phase === "done" &&
                <Center style={{flexGrow: 1}}>
                    <Stack align="center" gap="xl" maw={720} w="100%">
                        <Title order={1} ta="center">{t("wellDone", {name: student?.first_name ?? ""})}</Title>
                        {results &&
                            <>
                                <SimpleGrid cols={{base: 2, sm: 4}} w="100%">
                                    <Stat label={t("wordsRead")} value={t("xOfY", {count: results.current.total_cards_read, total: results.current.total_cards})}/>
                                    <Stat label={t("accuracy")} value={`${results.current.accuracy}%`}/>
                                    <Stat label={t("wordsCorrectPerMinute")} value={String(results.current.words_correct_per_minute)}/>
                                    <Stat label={t("timePerWord")} value={formatSeconds(results.current.avg_card_read_time, t, language)}/>
                                </SimpleGrid>
                                <Comparison results={results}/>
                                {results.current.wrong_words.length > 0 &&
                                    <Stack gap="xs" align="center">
                                        <Text fw={600}>{t("wordsToPractise")}</Text>
                                        <Group gap="xs" justify="center">
                                            {results.current.wrong_words.map((word, index) =>
                                                <Badge key={index} size="xl" variant="light" color="red" tt="none">{word}</Badge>
                                            )}
                                        </Group>
                                    </Stack>
                                }
                            </>
                        }
                        <Group>
                            {choice &&
                                <Button size="lg" variant="default" leftSection={<IconRefresh size={20}/>} onClick={readAgain}>
                                    {t("readAgain")}
                                </Button>
                            }
                            <Button size="lg" onClick={() => navigate("/students")}>
                                {t("backToStudents")}
                            </Button>
                        </Group>
                    </Stack>
                </Center>
            }
        </Box>
    )
}

const Stat: React.FC<{ label: string, value: string }> = ({label, value}) => (
    <Paper withBorder p="lg" radius="md">
        <Text size="sm" c="dimmed">{label}</Text>
        <Text fz={32} fw={700}>{value}</Text>
    </Paper>
);

const Comparison: React.FC<{ results: Results }> = ({results: {current, previous}}) => {
    const {t} = useI18n();
    const trend = getTrend(current, previous);
    if (!trend) {
        return null;
    }
    switch (trend.kind) {
        case "same":
            return <Text size="lg">{t("sameAsLastTime")}</Text>;
        case "better":
            return <Text size="lg" c="teal" fw={600}>{t("betterThanLastTime", {count: trend.difference})}</Text>;
        case "worse":
            return <Text size="lg">{t("worseThanLastTime", {count: trend.difference})}</Text>;
    }
}

/** Remounts the screen for every reading, so "Read again" starts with a clean slate. */
const ReadingRoute: React.FC = () => {
    const params = useParams();
    const assessmentId = Number(params.assessmentId);
    const studentId = Number(params.studentId);
    return <ReadingView key={assessmentId} assessmentId={assessmentId} studentId={studentId}/>;
}

export default ReadingRoute
