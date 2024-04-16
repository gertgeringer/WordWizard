import React from "react";
import {Anchor, Group, Stack, Title} from "@mantine/core";

interface NoContentMessageProps {
    listType: string;
    addClick: () => void
}

const NoContentMessage: React.FC<NoContentMessageProps> = ({listType, addClick}) => {
    return (
        <Stack m={"sm"} gap={5}>
            <Title order={5}>No {listType} found! 🌟</Title>
            <Group>
                Click<Anchor onClick={addClick} target="_blank" underline="always" p={0} m={0}>
                here</Anchor>to add one. Or click the new button in the top right.
            </Group>
        </Stack>
    );
}

export default NoContentMessage;