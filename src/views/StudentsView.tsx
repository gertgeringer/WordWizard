import {Group, Title} from "@mantine/core";
import StudentList from "../components/student/StudentList";
import { useDisclosure } from "@mantine/hooks";
import StudentDetails from "../components/student/StudentDetails";
import React, { useEffect, useState } from "react";
import NoContentMessage from "../components/common/NoContentMessage.tsx";
import AddButton from "../components/common/AddButton.tsx";
import {commands, Student} from "../bindings.ts";
import ViewPage from "../components/common/ViewPage.tsx";
import SideDrawer from "../components/common/SideDrawer.tsx";

const StudentsView: React.FC = () => {

    const [opened, {open, close}] = useDisclosure(false);
    const [selectedStudent, setSelectedStudent] = useState<Student>();
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        commands.getAllStudents().then(setStudents);
    }, [])

    return (
        <ViewPage>
            <Group justify="space-between">
                <Title order={3} size="h2" m={"xs"}>🧑‍🎓 STUDENTS</Title>
                <AddButton onClick={() => {
                    setSelectedStudent(undefined);
                    open();
                }}/>
            </Group>
            {students.length == 0 &&
                <NoContentMessage listType={"Students"} addClick={open}/>
            }
            {students.length > 0 &&
                <StudentList
                    students={students}
                    onStudentSelected={(student: Student) => {
                        setSelectedStudent(student);
                        open();
                    }}
                    onStudentDeleted={(student: Student) => {
                        commands.deleteStudent(student.id).then(() => {
                            setStudents(students => students.filter(s => s.id !== student.id))
                        });
                    }}
                />
            }
            <SideDrawer opened={opened} onClose={close} title={"New Student"}>
                <StudentDetails
                    selectedStudent={selectedStudent}
                    onStudentSaved={(updatedStudent) => {
                        if (students.filter(s => s.id == updatedStudent.id).length > 0) {
                            setStudents(students =>
                                students.map(item =>
                                    item.id === updatedStudent.id ? {...item, ...updatedStudent} : item
                                )
                            );
                        } else {
                            setStudents(students => [...students, updatedStudent]);
                        }
                        close()
                    }}
                />
            </SideDrawer>
        </ViewPage>
    );
}

export default StudentsView
