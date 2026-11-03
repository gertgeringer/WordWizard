import React, {useEffect, useState} from "react";
import {Avatar, Badge, Button, Group, Paper, Stack, Text, Title, Tooltip} from "@mantine/core";
import {IconChartLine, IconEqual, IconPlayerPlay, IconTrendingDown, IconTrendingUp} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import {commands, ReadResult, Student} from "../../bindings.ts";
import QuickMenu from "../common/QuickMenu.tsx";
import {formatDate, getFullName} from "../../utils/format.ts";
import {useI18n} from "../../i18n";
import {getTrend, Trend} from "../../utils/trend.ts";

interface StudentListItemProps {
    student: Student,
    onStartReading: (student: Student) => void,
    onStudentSelected: (student: Student) => void,
    onStudentDeleted: (student: Student) => void,
}

function getInitials(student: Student) {
    return student.first_name.charAt(0) + student.last_name.charAt(0);
}

const StudentListItem: React.FC<StudentListItemProps> = ({
                                                             student,
                                                             onStartReading,
                                                             onStudentSelected,
                                                             onStudentDeleted
                                                         }) => {

    const navigate = useNavigate();
    const {t, language} = useI18n();
    const [lastResult, setLastResult] = useState<ReadResult | null>();
    const [trend, setTrend] = useState<Trend>();

    useEffect(() => {
        commands.getStudentsReadResults(student.id).then((result) => {
            const results = result.status === "ok" ? result.data.results : [];
            setLastResult(results[0] ?? null);
            setTrend(getTrend(results[0], results[1]));
        });
    }, [student.id])

    return (
        <Paper withBorder shadow="xs" p="lg" radius="md">
            <Stack gap="md">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Group wrap="nowrap">
                        <Avatar size="lg" color="blue" radius="xl">{getInitials(student)}</Avatar>
                        <div>
                            <Group gap="xs">
                                <Title order={4}>{getFullName(student)}</Title>
                                {student.class_name && <Badge variant="default" tt="none">{student.class_name}</Badge>}
                                {trend && <TrendBadge trend={trend}/>}
                            </Group>
                            <Text size="sm" c="dimmed">
                                {lastResult === undefined && " "}
                                {lastResult === null && t("hasNotReadYet")}
                                {lastResult && t("lastRead", {
                                    date: formatDate(lastResult.eval_date_epoch, language),
                                    wcpm: lastResult.words_correct_per_minute,
                                    accuracy: lastResult.accuracy,
                                })}
                            </Text>
                        </div>
                    </Group>
                    <QuickMenu
                        item={student}
                        onEdit={onStudentSelected}
                        onDelete={onStudentDeleted}
                    />
                </Group>
                <Group grow>
                    <Button size="md" leftSection={<IconPlayerPlay size={18}/>} onClick={() => onStartReading(student)}>
                        {t("startReading")}
                    </Button>
                    <Button size="md" variant="default" leftSection={<IconChartLine size={18}/>}
                            onClick={() => navigate(`/students/${student.id}`)}>
                        {t("progress")}
                    </Button>
                </Group>
            </Stack>
        </Paper>
    )

}

const TrendBadge: React.FC<{ trend: Trend }> = ({trend}) => {
    const {t} = useI18n();
    const badge = {
        better: {color: "teal", icon: IconTrendingUp, label: t("trendBetter", {count: trend.difference})},
        worse: {color: "red", icon: IconTrendingDown, label: t("trendWorse", {count: trend.difference})},
        same: {color: "gray", icon: IconEqual, label: t("trendSame")},
    }[trend.kind];
    return (
        <Tooltip label={t("trendTooltip")}>
            <Badge variant="light" color={badge.color} size="lg" leftSection={<badge.icon size={14}/>}>
                {badge.label}
            </Badge>
        </Tooltip>
    );
}

export default StudentListItem
