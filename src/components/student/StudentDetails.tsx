import { TextInput, Button, Box } from "@mantine/core"
import { useForm } from "@mantine/form";
import {commands, Student} from "../../bindings.ts";
import React from "react";

interface StudentDetailsProps {
    selectedStudent?: Student,
    onStudentSaved: (student: Student) => void
}

const StudentDetails: React.FC<StudentDetailsProps> = ({
    onStudentSaved,
    selectedStudent
}) => {

    const form = useForm({
        initialValues: {
            firstName: selectedStudent?.first_name ?? "",
            lastName: selectedStudent?.last_name ?? "",
        },

        validate: {
            firstName: (value) => (value.length === 0 ? 'First name is required' : null),
            lastName: (value) => (value.length === 0 ? 'Last name is required' : null),
        },
    });

    return (
        <Box mx="auto">
            <form onSubmit={form.onSubmit((form) => {
                if (selectedStudent) {
                    commands.updateStudent(selectedStudent.id, form.firstName.trim(), form.lastName.trim()).then((result) => {
                        if (result.status === "ok") {
                            selectedStudent = undefined;
                            form.firstName = "";
                            form.lastName = "";
                            onStudentSaved(result.data)
                        }
                    })
                } else {
                    commands.createStudent(
                        form.firstName.trim(),
                        form.lastName.trim()
                    ).then((result) => {
                        if (result.status === "ok") {
                            form.firstName = "";
                            form.lastName = "";
                            onStudentSaved(result.data)
                        }
                    })
                }
            })}>
                <TextInput data-autofocus label="First name" placeholder="First name" {...form.getInputProps('firstName')} />
                <TextInput mt="md" label="Last name" placeholder="Last name" {...form.getInputProps('lastName')} />
                <Button type="submit" mt={"sm"}>Save</Button>
            </form>
        </Box>
    )

}

export default StudentDetails
