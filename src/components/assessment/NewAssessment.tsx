import {
    Anchor,
    Box,
    Button,
    Checkbox,
    Divider,
    Group,
    NumberInput,
    Paper,
    Space,
    Stack,
    TextInput,
    Title
} from "@mantine/core";
import DeckCard from "../deck/DeckCard.tsx";
import React, {useEffect, useState} from "react";
import {useForm} from "@mantine/form";
import {IconSelectAll} from "@tabler/icons-react";
import {Assessment, Card, commands, Deck, Student} from "../../bindings.ts";
import {useNavigate} from "react-router-dom";

interface NewAssessmentProps {
    onCreated: (assessment: Assessment) => void
}

interface SelectAllButtonProps {
    onClick: () => void
}

const SelectAllButton: React.FC<SelectAllButtonProps> = ({onClick}) => {
    return (
        <Button leftSection={<IconSelectAll size={14}/>} variant="default" onClick={onClick}>Select all</Button>
    );
}

const NewAssessment: React.FC<NewAssessmentProps> = ({onCreated}) => {

    const [students, setStudents] = useState<Student[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);

    const [selectedCards, setSelectedCards] = useState<Card[]>([])
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

    const navigate = useNavigate();

    function generateTitle(): string {
        return "Assessment " + new Date(Date.now()).toDateString()
    }

    function getStudentFullName(student: Student): string {
        return student.first_name + " " + student.last_name;
    }

    const form = useForm({
        initialValues: {
            title: generateTitle(),
            durationInSec: 60,
        },

        validate: {
            title: (value) => (value.length === 0 ? 'Title is required' : null),
            durationInSec: (value) => (value <= 0),
        },
    });

    useEffect(() => {
        commands.getAllStudents().then(setStudents);
        commands.getAllDecks().then(setDecks);
    }, []);

    return (
        <form onSubmit={form.onSubmit((form) => {
            if (selectedCards.length == 0 || selectedStudents.length == 0) {
                return;
            }
            commands.createAssessment(
                form.title,
                selectedStudents,
                selectedCards,
                form.durationInSec
            ).then((result) => {
                if (result.status === "ok") {
                    onCreated(result.data);
                }
            })
        })} >
            <Title order={4}>Details</Title>
            <Divider mt={"md"}/>
            <TextInput
                withAsterisk
                label="Title"
                {...form.getInputProps('title')}
            />
            <NumberInput
                withAsterisk
                label="Duration"
                {...form.getInputProps('durationInSec')}
            />
            <Space h="md"/>
            <Group justify={"space-between"}>
                <Title order={4}>Students</Title>
                <SelectAllButton onClick={() => {
                    setSelectedStudents(students);
                }} />
            </Group>
            <Divider mt={"md"}/>
            <Stack mt={"md"}>
                {students && students.length == 0 &&
                    <Group gap={5} display={"inline-block"}>You need students to create an assessment. Create some <Anchor onClick={() => {
                        navigate("/students");
                    }}>here</Anchor>.</Group>
                }
                {students && students.map((student, index) => (
                    <Paper key={index} shadow="xs" p="md">
                        <Group>
                            <Checkbox checked={selectedStudents.includes(student)} onChange={(evt) => {
                                let checked = evt.target.checked;
                                if (checked) {
                                    setSelectedStudents(s => [...s, student]);
                                } else {
                                    setSelectedStudents(st => st.filter(s => s.id != student.id));
                                }
                            }} />
                            {getStudentFullName(student)}
                        </Group>
                    </Paper>
                ))}
            </Stack>
            <Title mt={"md"} order={4}>Decks</Title>
            <Divider mt={"md"} mb={"md"}/>
            <Stack>
                {decks && decks.length == 0 &&
                    <Group gap={5} display={"inline-block"}>You need decks to create an assessment. Create some <Anchor onClick={() => {
                        navigate("/decks");
                    }}>here</Anchor>.</Group>
                }
                {decks && decks.map((deck, index) => (
                    <Paper key={index} shadow="xs" p="md">
                        <Group justify={"space-between"}>
                            <Title order={5}>{deck.title}</Title>
                            <SelectAllButton onClick={() => {
                                setSelectedCards(sc => [...sc, ...deck.cards])
                            }} />
                        </Group>
                        <Divider mt={"md"} mb={"md"}/>
                        <>
                            <Group>
                                {deck && deck.cards.map((card, index) => (
                                    <DeckCard key={index} cardImagePath={card.image_file_path} text={card.text} selectable={true} checked={selectedCards.includes(card)} onChange={(checked) => {
                                        if (checked) {
                                            setSelectedCards(s => [...s, card]);
                                        } else {
                                            setSelectedCards(st => st.filter(s => s.id != card.id));
                                        }
                                    }}/>
                                ))}
                            </Group>
                        </>
                    </Paper>
                ))}
            </Stack>
            <Box m={"md"}></Box>
            <Button type={"submit"}>Create</Button>
        </form>
    );
}

export default NewAssessment