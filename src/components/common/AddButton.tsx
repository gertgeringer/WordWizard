import {Button} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import React from "react";

interface AddButtonProps {
    onClick: () => void
}

const AddButton: React.FC<AddButtonProps> = ({onClick}) => {
    return (
        <Button leftSection={<IconPlus size={14}/>} variant="default" onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onClick();
        }}>
            New
        </Button>
    )
}

export default AddButton