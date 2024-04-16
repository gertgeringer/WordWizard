import {Flex, Group, Switch, Title,} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks";
import AssessmentList from "../components/assessment/AssessmentList";
import React, {useEffect, useState} from "react";
import NewAssessment from "../components/assessment/NewAssessment.tsx";
import NoContentMessage from "../components/common/NoContentMessage.tsx";
import AddButton from "../components/common/AddButton.tsx";
import {AssessmentWithStatus, commands} from "../bindings.ts";
import ViewPage from "../components/common/ViewPage.tsx";
import SideDrawer from "../components/common/SideDrawer.tsx";

const AssessmentsView: React.FC = () => {

    const [opened, {open, close}] = useDisclosure(false);
    const [aws, setAws] = useState<AssessmentWithStatus[]>([]);
    const [includeCompleted, setIncludeCompleted] = useState<boolean>(false);

    useEffect(() => {
        commands.getAllAssessments(includeCompleted).then(setAws);
    }, [includeCompleted])

    return (
        <ViewPage>
            <Group justify="space-between">
                <Title order={3} size="h2" m={"xs"}>📝 ASSESSMENTS</Title>
                <Group>
                    <>Show completed assessments</>
                    <Switch size="lg" onLabel="Yes" offLabel="No" onChange={(event) => {
                        setIncludeCompleted(event.target.checked)
                    }}/>
                    <AddButton onClick={open}/>
                </Group>
            </Group>
            {aws.length == 0 &&
                <NoContentMessage listType={"Assessments"} addClick={open}/>
            }
            <Flex style={{flexGrow: 1}}>
                <AssessmentList
                    assessments={aws}
                    onCopy={(assessment) => {
                        commands.copyAssessment(assessment.id).then((result) => {
                            if (result.status == "ok") {
                                setAws(aws => [...aws, result.data as any])
                            }
                        })
                    }}
                    onDeleted={(assessment) => {
                        commands.deleteAssessment(assessment.id).then(() => {
                            setAws(aws => aws.filter(a => a.assessment.id !== assessment.id))
                        })
                    }}/>
            </Flex>
            <SideDrawer opened={opened} onClose={close} title={"New Assessment"}>
                <NewAssessment onCreated={(a) => {
                    let aws: AssessmentWithStatus = {
                        assessment: a,
                        status: {
                            state: "NotStarted",
                            progress: 0
                        }
                    }
                    setAws(awss => [...awss, aws]);
                    close()
                }}/>
            </SideDrawer>
        </ViewPage>
    )
}

export default AssessmentsView
