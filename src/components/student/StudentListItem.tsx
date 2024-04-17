import React, {useEffect, useState} from "react";
import {Avatar, Box, Button, Collapse, Divider, Group, Paper, Table, Title} from "@mantine/core";
import {commands, ReadResult, Student} from "../../bindings.ts";
import QuickMenu from "../common/QuickMenu.tsx";
import {useDisclosure} from "@mantine/hooks";
import {IconSelectAll} from "@tabler/icons-react";

interface StudentListItemProps {
    student: Student,
    onStudentSelected: (student: Student) => void,
    onStudentDeleted: (student: Student) => void,
}

function getInitials(student: Student) {
    return student.first_name.charAt(0) + student.last_name.charAt(0);
}

function getFullName(student: Student) {
    return student.first_name + " " + student.last_name;
}

const StudentListItem: React.FC<StudentListItemProps> = ({
                                                             student,
                                                             onStudentSelected,
                                                             onStudentDeleted
                                                         }) => {

    useEffect(() => {
        commands.getStudentsReadResults(student.id).then((sr) => {
            console.log(sr.results);
            setResults(sr.results);
        });
    }, [])

    const [opened, {toggle}] = useDisclosure(false);
    const [results, setResults] = useState<ReadResult[]>([]);

    const rows = results.map((element) => (
        <Table.Tr key={element.eval_date_epoch}>
            <Table.Td>
                {
                    (new Date((element.eval_date_epoch ?? 0) * 1000)).toLocaleDateString() + " " +
                    (new Date((element.eval_date_epoch ?? 0) * 1000)).toLocaleTimeString()
                }
            </Table.Td>
            <Table.Td>{element.total_cards}</Table.Td>
            <Table.Td>{element.total_cards_read}</Table.Td>
            <Table.Td>{element.avg_card_read_time / 1000} Seconds</Table.Td>
            <Table.Td>{element.total_read_time / 1000} Seconds</Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper shadow="xs" p="md">
            <Group justify={"space-between"}>
                <Group>
                    <Avatar src={null} color="red">{getInitials(student)}</Avatar>
                    <Box>
                        <Title order={5}>{getFullName(student)}</Title>
                    </Box>
                </Group>
                <Group>
                    <Button leftSection={<IconSelectAll size={14}/>} variant="default" onClick={toggle}>View Reading
                        Results</Button>
                    <QuickMenu
                        item={student}
                        onEdit={onStudentSelected}
                        onDelete={onStudentDeleted}
                    />
                </Group>
            </Group>
            <Collapse in={opened}>
                {results.length == 0 &&
                    <Box mt={"md"} mb={"md"}>{student.first_name} has no assessment results available.</Box>
                }
                {results.length > 0 &&
                    <>
                        <Divider mt={"md"} mb={"md"}/>
                        <Title order={6} mb={"md"}>Previous Assessment Results</Title>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Card Count</Table.Th>
                                    <Table.Th>Cards Read</Table.Th>
                                    <Table.Th>Average Card Read Time</Table.Th>
                                    <Table.Th>Total Read Time</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </>
                }

            </Collapse>
        </Paper>
    )

}

export default StudentListItem