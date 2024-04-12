import {
    Group,
    Title,
    Flex,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
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

    useEffect(() => {
        commands.getAllAssessments().then(setAws);
    }, [])

    return (
        <ViewPage>
            <Group justify="space-between">
                <Title order={3} size="h2" m={"xs"}>📝 ASSESSMENTS</Title>
                <AddButton onClick={open}/>
            </Group>
            {aws.length == 0 &&
                <NoContentMessage listType={"Assessments"} addClick={open}/>
            }
            <Flex style={{flexGrow: 1}}>
                <AssessmentList assessments={aws} onDeleted={(assessment) => {
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
                }} />
            </SideDrawer>
        </ViewPage>
    )
}

export default AssessmentsView
