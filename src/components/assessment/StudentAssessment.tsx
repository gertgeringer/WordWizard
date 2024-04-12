import {Box, Button, Group, Paper, Pill, Title} from "@mantine/core";
import {IconBook} from "@tabler/icons-react";
import {StudentEvaluation} from "../../bindings.ts";
import React from "react";

interface StudentAssessmentProps {
    studentEvaluation: StudentEvaluation
    start: (studentEvaluation: StudentEvaluation) => void
}

const StudentAssessment: React.FC<StudentAssessmentProps> = (
    {
        studentEvaluation,
        start
    }
) => {
    return (
        <Paper shadow="xs" p="xs">
            <Group justify="space-between">
                <Box>
                    <Group>
                        <Title order={5}>{studentEvaluation.student.first_name + " " + studentEvaluation.student.last_name}</Title>
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
                    <Button
                        disabled={studentEvaluation.state == "Completed"}
                        leftSection={<IconBook size={14}/>}
                        variant="default"
                        onClick={() => start(studentEvaluation)}
                    >
                        Assess
                    </Button>
                </Box>
            </Group>
        </Paper>

    )
}

export default StudentAssessment