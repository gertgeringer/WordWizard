import {SimpleGrid} from "@mantine/core";
import React from "react";
import StudentListItem from "./StudentListItem.tsx";
import {Student} from "../../bindings.ts";

interface StudentListProps {
    students: Student[]
    onStartReading: (student: Student) => void
    onStudentSelected: (student: Student) => void
    onStudentDeleted: (student: Student) => void
}

const StudentList: React.FC<StudentListProps> = ({students, onStartReading, onStudentSelected, onStudentDeleted}) => {
    return (
        <SimpleGrid cols={{base: 1, sm: 2, lg: 3}}>
            {students.map((student) => (
                <StudentListItem key={student.id} student={student} onStartReading={onStartReading}
                                 onStudentDeleted={onStudentDeleted} onStudentSelected={onStudentSelected}/>
            ))}
        </SimpleGrid>
    )
}

export default StudentList
