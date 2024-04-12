import React from "react";
import {Anchor, Group} from "@mantine/core";

interface NoContentMessageProps {
    listType: string;
    addClick: () => void
}

const NoContentMessage: React.FC<NoContentMessageProps> = ({listType, addClick}) => {
    return (
        <Group m={"sm"} gap={5}>
            You do not have any {listType}. Click<Anchor onClick={addClick} target="_blank" underline="always">
            here</Anchor>to add one. Or click the new button in the top right.
        </Group>
    );
}

export default NoContentMessage;