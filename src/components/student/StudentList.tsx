import {Stack} from "@mantine/core";
import React from "react";
import StudentListItem from "./StudentListItem.tsx";
import {Student} from "../../bindings.ts";

interface StudentListProps {
    students: Student[]
    onStudentSelected: (student: Student) => void
    onStudentDeleted: (student: Student) => void
}

const StudentList: React.FC<StudentListProps> = ({ students, onStudentSelected, onStudentDeleted }) => {
    return (
        <Stack>
            {students.map((student, index) => (
                    <StudentListItem key={index} student={student} onStudentDeleted={onStudentDeleted}
                                     onStudentSelected={onStudentSelected}/>
                )
            )}
        </Stack>
    )
}

export default StudentList
