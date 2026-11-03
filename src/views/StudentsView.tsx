import {Button, Group, Select, Stack, Text, TextInput, Title} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconSchool, IconSearch, IconUserPlus} from "@tabler/icons-react";
import StudentList from "../components/student/StudentList";
import StudentDetails from "../components/student/StudentDetails";
import React, {useEffect, useMemo, useState} from "react";
import {commands, Student} from "../bindings.ts";
import SideDrawer from "../components/common/SideDrawer.tsx";
import StartReadingModal from "../components/reading/StartReadingModal.tsx";
import {message} from "@tauri-apps/api/dialog";
import {getFullName} from "../utils/format.ts";
import {useI18n} from "../i18n";
import {getClassFilter, rememberClassFilter} from "../utils/preferences.ts";

const ALL_CLASSES = "__all__";
const NO_CLASS = "__none__";

const StudentsView: React.FC = () => {

    const [opened, {open, close}] = useDisclosure(false);
    const [selectedStudent, setSelectedStudent] = useState<Student>();
    const [readingStudent, setReadingStudent] = useState<Student>();
    const [students, setStudents] = useState<Student[]>();
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState(getClassFilter() ?? ALL_CLASSES);
    const {t} = useI18n();

    const classNames = useMemo(() =>
        [...new Set((students ?? []).map(s => s.class_name ?? "").filter(c => c.length > 0))]
            .sort((a, b) => a.localeCompare(b, undefined, {numeric: true})), [students]);
    const hasStudentsWithoutClass = (students ?? []).some(s => !s.class_name);
    // A remembered class that no longer exists shows everyone instead of nobody.
    const activeClassFilter = classFilter === ALL_CLASSES || classFilter === NO_CLASS || classNames.includes(classFilter)
        ? classFilter : ALL_CLASSES;

    const changeClassFilter = (value: string) => {
        setClassFilter(value);
        rememberClassFilter(value);
    }

    useEffect(() => {
        commands.getAllStudents().then(students =>
            setStudents(students.sort((a, b) => getFullName(a).localeCompare(getFullName(b))))
        );
    }, [])

    const openNewStudent = () => {
        setSelectedStudent(undefined);
        open();
    }

    const visibleStudents = (students ?? [])
        .filter(s => activeClassFilter === ALL_CLASSES
            || (activeClassFilter === NO_CLASS ? !s.class_name : s.class_name === activeClassFilter))
        .filter(s => getFullName(s).toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={2}>{t("studentsTitle")}</Title>
                <Group>
                    {classNames.length > 0 &&
                        <Select
                            aria-label={t("classFilter")}
                            leftSection={<IconSchool size={16}/>}
                            allowDeselect={false}
                            value={activeClassFilter}
                            onChange={(value) => value && changeClassFilter(value)}
                            data={[
                                {value: ALL_CLASSES, label: t("allClasses")},
                                ...classNames.map(c => ({value: c, label: c})),
                                ...(hasStudentsWithoutClass ? [{value: NO_CLASS, label: t("noClass")}] : []),
                            ]}
                        />
                    }
                    {students && students.length > 6 &&
                        <TextInput
                            placeholder={t("findStudent")}
                            leftSection={<IconSearch size={16}/>}
                            value={search}
                            onChange={(event) => setSearch(event.currentTarget.value)}
                        />
                    }
                    <Button size="md" leftSection={<IconUserPlus size={18}/>} onClick={openNewStudent}>
                        {t("addStudent")}
                    </Button>
                </Group>
            </Group>

            {students && students.length === 0 &&
                <Stack align="center" py={80} gap="md">
                    <Text size="xl" fw={600}>{t("welcomeTitle")}</Text>
                    <Text c="dimmed" ta="center" maw={420}>{t("welcomeText")}</Text>
                    <Button size="lg" leftSection={<IconUserPlus size={20}/>} onClick={openNewStudent}>
                        {t("addFirstStudent")}
                    </Button>
                </Stack>
            }

            {students && students.length > 0 && visibleStudents.length === 0 &&
                <Text c="dimmed">{t("noStudentMatches", {search})}</Text>
            }

            <StudentList
                students={visibleStudents}
                onStartReading={setReadingStudent}
                onStudentSelected={(student: Student) => {
                    setSelectedStudent(student);
                    open();
                }}
                onStudentDeleted={(student: Student) => {
                    commands.deleteStudent(student.id).then((result) => {
                        if (result.status === "ok") {
                            setStudents(students => students?.filter(s => s.id !== student.id))
                        } else {
                            message(result.error, {title: t("error")});
                        }
                    });
                }}
            />

            <SideDrawer opened={opened} onClose={close} title={selectedStudent ? t("editStudent") : t("addStudent")}>
                <StudentDetails
                    selectedStudent={selectedStudent}
                    classNames={classNames}
                    defaultClassName={classNames.includes(activeClassFilter) ? activeClassFilter : ""}
                    onStudentSaved={(savedStudent) => {
                        setStudents(students =>
                            students?.some(s => s.id === savedStudent.id)
                                ? students.map(s => s.id === savedStudent.id ? savedStudent : s)
                                : [...(students ?? []), savedStudent]
                        );
                        close()
                    }}
                />
            </SideDrawer>

            <StartReadingModal student={readingStudent} onClose={() => setReadingStudent(undefined)}/>
        </Stack>
    );
}

export default StudentsView
