import React from "react";
import {Avatar, Box, Group, Paper, Title} from "@mantine/core";
import {Student} from "../../bindings.ts";
import QuickMenu from "../common/QuickMenu.tsx";

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

    return (
            <Paper shadow="xs" p="md">
                <Group justify={"space-between"}>
                    <Group>
                        <Avatar src={null} color="red">{getInitials(student)}</Avatar>
                        <Box>
                            <Title order={5}>{getFullName(student)}</Title>
                        </Box>
                    </Group>
                    <QuickMenu
                        item={student}
                        onEdit={onStudentSelected}
                        onDelete={onStudentDeleted}
                    />
                </Group>
            </Paper>
    )

}

export default StudentListItem