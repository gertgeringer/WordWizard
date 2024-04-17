import React, {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Flex, Group, Image, Title} from "@mantine/core";
import {IconCaretRight, IconPlayerPlay} from "@tabler/icons-react";
import "./ReadEvaluationView.css";
import Timer from "../components/common/Timer.tsx";
import {convertFileSrc} from "@tauri-apps/api/tauri";
import {CardEvaluation, commands} from "../bindings.ts";
import ViewPage from "../components/common/ViewPage.tsx";

const ReadEvaluationView: React.FC = () => {

    let {evaluationId, studentId} = useParams();

    const [studentName, setStudentName] = useState<String>();
    const [activeCard, setActiveCard] = useState<CardEvaluation>();
    const [cardReadDuration, setCardReadDuration] = useState<number>();

    let navigate = useNavigate();


    const cardRead = () => {
        commands.cardReadEnd(
            parseInt(studentId as any),
            parseInt(evaluationId as any)
        ).then(activeCard => {
            if (!activeCard) {
                stopEvaluation();
            } else {
                setActiveCard(activeCard as CardEvaluation)
            }
        })
    }

    const stopEvaluation = () => {
        commands.stopEvaluation(
            parseInt(evaluationId as any),
            parseInt(studentId as any)
        ).then(() => {
            navigate("/assessments")
        })
    }

    return (
        <ViewPage>
            {!activeCard &&
                <Flex direction={"column"} h={"calc(100vh - 90px)"}>
                    <Group style={{flexGrow: "1", flexDirection: "column"}} justify="center">
                        <Button
                            leftSection={<IconPlayerPlay size={14}/>} variant="default"
                            onClick={() => {
                                if (evaluationId && studentId) {
                                    commands.startEvaluation(
                                        parseInt(evaluationId as any),
                                        parseInt(studentId as any)
                                    ).then((init) => {
                                        setStudentName((init as any).student_name);
                                        setActiveCard((init as any).active_card);
                                        setCardReadDuration((init as any).card_read_duration_in_sec)
                                    });
                                }
                            }}>Start</Button>
                    </Group>
                </Flex>
            }

            {activeCard && evaluationId &&
                <>
                    <Group justify="space-between">
                        <Title order={3} size="h2" m={"xs"}>{studentName} is reading</Title>
                    </Group>
                    <Flex direction={"column"} h={"calc(100vh - 90px)"}>
                        <Group style={{flexGrow: "1", flexDirection: "column"}} justify="center">
                            {activeCard.card.image_file_path &&
                                <Image
                                    radius="md"
                                    mah={260}
                                    w="auto"
                                    fit="contain"
                                    src={convertFileSrc(activeCard.card.image_file_path)}
                                />
                            }

                            <Title
                                style={{
                                    fontFamily: 'ABCJuniorTyping',
                                    fontSize: "64px",
                                    textAlign: "center"
                                }}
                            >
                                {activeCard.card.text}
                            </Title>
                        </Group>
                        <Group justify="space-between">
                            {cardReadDuration &&
                                <Timer onTimerComplete={() => {
                                    stopEvaluation();
                                }} durationInSec={cardReadDuration}/>
                            }
                            <Button
                                leftSection={<IconCaretRight size={14}/>} variant="default"
                                onClick={cardRead}>
                                Next card
                            </Button>
                        </Group>
                    </Flex>
                </>
            }

        </ViewPage>
    )

}

export default ReadEvaluationView