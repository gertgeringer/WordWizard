import { TextInput, Button, Box, Autocomplete } from "@mantine/core"
import { useForm } from "@mantine/form";
import {commands, Student} from "../../bindings.ts";
import React from "react";
import {message} from "@tauri-apps/api/dialog";
import {useI18n} from "../../i18n";

interface StudentDetailsProps {
    selectedStudent?: Student,
    classNames: string[],
    defaultClassName: string,
    onStudentSaved: (student: Student) => void
}

const StudentDetails: React.FC<StudentDetailsProps> = ({
    onStudentSaved,
    selectedStudent,
    classNames,
    defaultClassName
}) => {

    const {t} = useI18n();

    const form = useForm({
        initialValues: {
            firstName: selectedStudent?.first_name ?? "",
            lastName: selectedStudent?.last_name ?? "",
            className: selectedStudent ? selectedStudent.class_name ?? "" : defaultClassName,
        },

        validate: {
            firstName: (value) => (value.trim().length === 0 ? t("firstNameRequired") : null),
            lastName: (value) => (value.trim().length === 0 ? t("lastNameRequired") : null),
        },
    });

    return (
        <Box mx="auto">
            <form onSubmit={form.onSubmit((values) => {
                const firstName = values.firstName.trim();
                const lastName = values.lastName.trim();
                const className = values.className.trim();
                const save = selectedStudent
                    ? commands.updateStudent(selectedStudent.id, firstName, lastName, className)
                    : commands.createStudent(firstName, lastName, className);
                save.then((result) => {
                    if (result.status === "ok") {
                        onStudentSaved(result.data)
                    } else {
                        message(result.error, {title: t("error")});
                    }
                })
            })}>
                <TextInput data-autofocus label={t("firstName")} placeholder={t("firstName")} {...form.getInputProps('firstName')} />
                <TextInput mt="md" label={t("lastName")} placeholder={t("lastName")} {...form.getInputProps('lastName')} />
                <Autocomplete mt="md" label={t("className")} placeholder={t("classNamePlaceholder")}
                              description={t("classNameHelp")} data={classNames} {...form.getInputProps('className')} />
                <Button type="submit" mt={"lg"}>{t("save")}</Button>
            </form>
        </Box>
    )

}

export default StudentDetails
