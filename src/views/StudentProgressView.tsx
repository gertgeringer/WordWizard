import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title} from "@mantine/core";
import {IconArrowLeft, IconPlayerPlay} from "@tabler/icons-react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {commands, ReadResult, Student} from "../bindings.ts";
import {formatDate, formatSeconds, getFullName} from "../utils/format.ts";
import StartReadingModal from "../components/reading/StartReadingModal.tsx";
import {useI18n} from "../i18n";
import {getWordsToPractise} from "../utils/trend.ts";

const StudentProgressView: React.FC = () => {

    const navigate = useNavigate();
    const {t, language} = useI18n();
    const studentId = Number(useParams().studentId);
    const [student, setStudent] = useState<Student>();
    const [results, setResults] = useState<ReadResult[]>();
    const [startReading, setStartReading] = useState(false);

    useEffect(() => {
        commands.getStudentsReadResults(studentId).then((result) => {
            if (result.status === "ok") {
                setStudent(result.data.student);
                setResults(result.data.results);
            } else {
                navigate("/students");
            }
        });
    }, [studentId]);

    if (!student || !results) {
        return null;
    }

    const readResults = results.filter(r => r.total_cards_read > 0);
    const best = readResults.reduce<ReadResult | undefined>(
        (best, r) => !best || r.words_correct_per_minute > best.words_correct_per_minute ? r : best, undefined);
    const chartData = [...readResults].reverse().map(r => ({
        date: formatDate(r.eval_date_epoch, language),
        title: r.title,
        wcpm: r.words_correct_per_minute,
    }));
    // Recent mistakes matter most, so only look at the last 5 readings.
    const wordsToPractise = getWordsToPractise(results.slice(0, 5));

    return (
        <Stack>
            <Group>
                <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={18}/>}
                        onClick={() => navigate("/students")}>
                    {t("allStudents")}
                </Button>
            </Group>
            <Group justify="space-between">
                <Title order={2}>{getFullName(student)}</Title>
                <Button size="md" leftSection={<IconPlayerPlay size={18}/>} onClick={() => setStartReading(true)}>
                    {t("startReading")}
                </Button>
            </Group>

            {results.length === 0 &&
                <Paper withBorder p="xl" radius="md">
                    <Text size="lg" ta="center">{t("notReadYetLong", {name: student.first_name})}</Text>
                </Paper>
            }

            {results.length > 0 &&
                <>
                    <SimpleGrid cols={{base: 2, sm: 4}}>
                        <Stat label={t("readings")} value={String(results.length)}/>
                        <Stat label={t("latestWordsCorrectPerMinute")} value={String(results[0].words_correct_per_minute)}/>
                        <Stat label={t("bestWordsCorrectPerMinute")} value={best ? String(best.words_correct_per_minute) : "-"}/>
                        <Stat label={t("latestAccuracy")} value={`${results[0].accuracy}%`}/>
                    </SimpleGrid>

                    {wordsToPractise.length > 0 &&
                        <Paper withBorder p="lg" radius="md">
                            <Text fw={600}>{t("wordsToPractise")}</Text>
                            <Text size="sm" c="dimmed" mb="md">{t("wordsToPractiseHelp")}</Text>
                            <Group gap="xs">
                                {wordsToPractise.map(({word, count}) =>
                                    <Badge key={word} size="xl" variant="light" color="red" tt="none"
                                           rightSection={count > 1 ? `×${count}` : undefined}>
                                        {word}
                                    </Badge>
                                )}
                            </Group>
                        </Paper>
                    }

                    {chartData.length >= 2 &&
                        <Paper withBorder p="lg" radius="md">
                            <Text fw={600}>{t("wordsCorrectPerMinute")}</Text>
                            <Text size="sm" c="dimmed" mb="md">{t("higherIsBetter")}</Text>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartData} margin={{top: 8, right: 16, bottom: 0, left: -16}}>
                                    <CartesianGrid vertical={false} stroke="var(--mantine-color-default-border)"/>
                                    <XAxis dataKey="date" tickLine={false} axisLine={false}
                                           tick={{fill: "var(--mantine-color-dimmed)", fontSize: 12}}/>
                                    <YAxis tickLine={false} axisLine={false} allowDecimals={false}
                                           tick={{fill: "var(--mantine-color-dimmed)", fontSize: 12}}/>
                                    <Tooltip
                                        cursor={{stroke: "var(--mantine-color-dimmed)"}}
                                        contentStyle={{
                                            background: "var(--mantine-color-body)",
                                            border: "1px solid var(--mantine-color-default-border)",
                                            borderRadius: 8,
                                        }}
                                        labelStyle={{color: "var(--mantine-color-text)"}}
                                        itemStyle={{color: "var(--mantine-color-text)"}}
                                        formatter={(value) => [String(value), t("wordsCorrectPerMinute")]}
                                        labelFormatter={(label, payload) => `${label} · ${payload?.[0]?.payload?.title ?? ""}`}
                                    />
                                    <Line type="monotone" dataKey="wcpm" stroke="var(--mantine-color-blue-5)"
                                          strokeWidth={2} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    }

                    <Paper withBorder radius="md">
                        <Table verticalSpacing="sm" horizontalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t("columnDate")}</Table.Th>
                                    <Table.Th>{t("columnDeck")}</Table.Th>
                                    <Table.Th>{t("wordsRead")}</Table.Th>
                                    <Table.Th>{t("accuracy")}</Table.Th>
                                    <Table.Th>{t("wordsCorrectPerMinuteShort")}</Table.Th>
                                    <Table.Th>{t("timePerWord")}</Table.Th>
                                    <Table.Th>{t("wrongWords")}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {results.map((r, index) => (
                                    <Table.Tr key={index}>
                                        <Table.Td>{formatDate(r.eval_date_epoch, language)}</Table.Td>
                                        <Table.Td>{r.title}</Table.Td>
                                        <Table.Td>{t("xOfY", {count: r.total_cards_read, total: r.total_cards})}</Table.Td>
                                        <Table.Td>{r.accuracy}%</Table.Td>
                                        <Table.Td>{r.words_correct_per_minute}</Table.Td>
                                        <Table.Td>{formatSeconds(r.avg_card_read_time, t, language)}</Table.Td>
                                        <Table.Td>{r.wrong_words.join(", ") || "-"}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </>
            }

            <StartReadingModal student={startReading ? student : undefined} onClose={() => setStartReading(false)}/>
        </Stack>
    );
}

const Stat: React.FC<{ label: string, value: string }> = ({label, value}) => (
    <Paper withBorder p="lg" radius="md">
        <Text size="sm" c="dimmed">{label}</Text>
        <Text fz={28} fw={700}>{value}</Text>
    </Paper>
);

export default StudentProgressView
