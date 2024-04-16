import {Stack} from "@mantine/core";
import AssessmentListItem from "./AssessmentListItem";
import {Assessment, AssessmentWithStatus} from "../../bindings.ts";
import ViewNavbar from "../common/viewnavbar/ViewNabar.tsx";
import React, {useEffect, useState} from "react";

interface AssessmentListProps {
    assessments: AssessmentWithStatus[]
    onDeleted: (assessment: Assessment) => void
    onCopy: (assessment: Assessment) => void
}

function getAssessmentDescription(aws: AssessmentWithStatus) {
    return aws.assessment.students.length + " students reading " + aws.assessment.cards.length + " cards (" + aws.status.state + ")";
}

function getSelectedAssessment(aws: AssessmentWithStatus[]) {
    if (aws.length === 0) {
        return 0;
    }
    let inProgressAssessments = aws.filter(a => a.status.state === "InProgress");
    if (inProgressAssessments.length === 0) {
        return aws[0].assessment.id;
    } else {
        return inProgressAssessments[0].assessment.id;
    }
}

const AssessmentList: React.FC<AssessmentListProps> = ({assessments, onDeleted, onCopy}) => {

    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number>();

    useEffect(() => {
        setSelectedAssessmentId(getSelectedAssessment(assessments));
    }, [assessments])

    let sortedAssessments = assessments.sort((a, b) => b.status.state.localeCompare(a.status.state));
    return (
        <>
            <ViewNavbar
                selectedId={selectedAssessmentId}
                onClick={(item) => {
                    setSelectedAssessmentId(item.id);
                }}
                items={sortedAssessments.map(a => {
                    return {
                        id: a.assessment.id,
                        label: a.assessment.title,
                        description: getAssessmentDescription(a)
                    }
                })}/>
            <Stack gap="xs" style={{flexGrow: "1"}}>
                {sortedAssessments
                    .map((a, index) => (
                        <AssessmentListItem key={index} aws={a} onDeleted={onDeleted} onCopy={onCopy}
                                            opened={a.assessment.id === selectedAssessmentId}/>
                    ))}
            </Stack>
        </>
    );

}

export default AssessmentList