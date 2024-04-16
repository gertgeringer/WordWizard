import React, {useState} from "react";
import {ActionIcon, Button, Group, Menu, Modal, Text} from "@mantine/core";
import {IconDotsVertical, IconEdit, IconTrash} from "@tabler/icons-react";

interface QuickMenuProps {
    item: any,
    onEdit?: (item: any) => void,
    onDelete?: (item: any) => void,
    onCopy?: (item: any) => void,
    onView?: (item: any) => void
}

const QuickMenu: React.FC<QuickMenuProps> = ({
                                                 item,
                                                 onDelete,
                                                 onEdit,
                                                 onCopy,
                                                 onView
                                             }) => {

    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

    return (
        <>
            <Menu
                closeOnClickOutside={true}
                openDelay={100}
                closeDelay={400}
                position="right"
                withArrow
            >
                <Menu.Target>
                    <ActionIcon variant="filled" aria-label="Settings" onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                    }}>
                        <IconDotsVertical style={{width: '70%', height: '70%'}} stroke={1.5}/>
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    {onEdit &&
                        <Menu.Item
                            leftSection={<IconEdit size={14}/>}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onEdit(item);
                            }}
                        >
                            Edit
                        </Menu.Item>
                    }
                    {onCopy &&
                        <Menu.Item
                            leftSection={<IconEdit size={14}/>}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onCopy(item);
                            }}
                        >
                            Copy
                        </Menu.Item>
                    }
                    {onView &&
                        <Menu.Item
                            leftSection={<IconEdit size={14}/>}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onView(item);
                            }}
                        >
                            View
                        </Menu.Item>
                    }
                    {onDelete &&
                        <>
                            <Menu.Label>Danger zone</Menu.Label>
                            <Menu.Item
                                color={"red"}
                                leftSection={<IconTrash size={14}/>}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    setShowConfirmDialog(true);
                                }}
                            >
                                Delete
                            </Menu.Item>
                        </>
                    }
                </Menu.Dropdown>
            </Menu>
            <Modal opened={showConfirmDialog} onClose={close}>
                <Text>Permanently delete the selected item?</Text>
                <Group mt={"md"} justify={"space-between"}>
                    <Button color={"red"} onClick={() => {
                        if (onDelete) {
                            setShowConfirmDialog(false);
                            onDelete(item);
                        }
                    }}>Yes</Button>
                    <Button onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setShowConfirmDialog(false);
                    }}>Cancel</Button>
                </Group>
            </Modal>
        </>
    )
}

export default QuickMenu