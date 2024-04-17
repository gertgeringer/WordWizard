import {Box, Button, Group, Paper, Pill, Title} from "@mantine/core";
import {IconBook, IconPlayerPlay, IconRestore} from "@tabler/icons-react";
import {StudentEvaluation} from "../../bindings.ts";
import React from "react";

interface StudentAssessmentProps {
    studentEvaluation: StudentEvaluation
    onStart: (studentEvaluation: StudentEvaluation) => void
    onReset: (studentEvaluation: StudentEvaluation) => Promise<StudentEvaluation>
    assessmentCompleted: boolean
}

const StudentAssessment: React.FC<StudentAssessmentProps> = (
    {
        studentEvaluation,
        onStart,
        onReset,
        assessmentCompleted
    }
) => {
    return (
        <Paper shadow="xs" p="xs">
            <Group justify="space-between">
                <Box>
                    <Group>
                        <Title
                            order={5}>{studentEvaluation.student.first_name + " " + studentEvaluation.student.last_name}</Title>
                        <>
                            {studentEvaluation.state && studentEvaluation.state == "Completed" && studentEvaluation.result &&
                                <Pill>
                                    Read {studentEvaluation.result?.cards_read_count} cards
                                    in {studentEvaluation.result.evaluation_time_in_ms / 1000} seconds
                                </Pill>
                            }
                        </>
                    </Group>
                </Box>
                <Box>
                    {!assessmentCompleted && studentEvaluation.state == "Completed" &&
                        <Button
                            leftSection={<IconRestore size={14}/>}
                            variant="default"
                            onClick={() => {
                                onReset(studentEvaluation).then((studentEvaluation) => {
                                    onStart(studentEvaluation);
                                });
                            }}
                        >
                            Redo
                        </Button>
                    }
                    {studentEvaluation.state == "NotStarted" &&
                        <Button
                            leftSection={<IconBook size={14}/>}
                            variant="default"
                            onClick={() => onStart(studentEvaluation)}
                        >
                            Assess
                        </Button>
                    }
                    {studentEvaluation.state == "InProgress" &&
                        <Button
                            leftSection={<IconPlayerPlay size={14}/>}
                            variant="default"
                            onClick={() => onStart(studentEvaluation)}
                        >
                            Continue
                        </Button>
                    }
                </Box>
            </Group>
        </Paper>

    )
}

export default StudentAssessment