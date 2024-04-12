import React from "react";
import { useNavigate } from "react-router-dom";
import {Assessment, AssessmentWithStatus, StudentEvaluation} from "../../bindings.ts";
import {
    Box,
    Group,
    Paper,
    RingProgress,
    Title,
    Text,
    Collapse,
    Space,
    Divider,
    Stack
} from "@mantine/core";
import StudentAssessment from "./StudentAssessment.tsx";
import DeckCard from "../deck/DeckCard.tsx";
import QuickMenu from "../common/QuickMenu.tsx";

interface AssessmentListItemProps {
    aws: AssessmentWithStatus,
    onDeleted: (assessment: Assessment) => void,
    opened: boolean
}

const AssessmentListItem: React.FC<AssessmentListItemProps> = ({ aws, onDeleted, opened}) => {

    let navigate = useNavigate();

    const startStudentEvaluation = (se: StudentEvaluation) => {
        navigate(`/evaluation/${aws.assessment.id}/student/${se.student.id}`)
    }

    return (
        <>
            {aws &&
                <Paper shadow="xs" p="md">
                    <Group justify="space-between">
                        <Box>
                            <Title order={4}>{aws.assessment.title}</Title>
                            <Text>{aws.assessment.students.length} students
                                reading {aws.assessment.cards.length} cards</Text>
                        </Box>
                        <Group>
                            <Box>
                                <Group>
                                    <RingProgress
                                        size={50}
                                        thickness={6}
                                        roundCaps
                                        sections={[
                                            {value: aws.status.progress, color: 'cyan'},
                                        ]}
                                    />
                                    <Text>{aws.status.state}</Text>
                                </Group>
                            </Box>
                            <QuickMenu item={aws.assessment} onDelete={(item) => onDeleted(item)}/>
                        </Group>
                    </Group>
                    <Collapse in={opened}>
                        <Space h={"md"}/>
                        <Divider/>
                        <Space h={"md"}/>
                        <Title order={5}>Students in assessment</Title>
                        <Space h={"md"}/>
                        <Stack>
                            {aws.assessment.student_evaluations
                                .sort((a, b) => a.state.localeCompare(b.state)).reverse()
                                .map((se, index) => (
                                    <StudentAssessment
                                        key={index}
                                        studentEvaluation={se}
                                        start={(se) => startStudentEvaluation(se)}
                                    />
                                ))}
                        </Stack>
                        <Space h={"md"}/>
                        <Divider/>
                        <Space h={"md"}/>
                        <Title order={5}>Cards in assessment</Title>
                        <Space h={"md"}/>
                        <Group>
                            {aws.assessment.cards.map((c, i) => (
                                <DeckCard key={i} text={c.text} cardImagePath={c.image_file_path}/>
                            ))}
                        </Group>
                    </Collapse>
                </Paper>
            }
        </>
    );
}

export default AssessmentListItem