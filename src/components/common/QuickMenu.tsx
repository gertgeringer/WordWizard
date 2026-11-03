import React, {useState} from "react";
import {ActionIcon, Button, Group, Menu, Modal, Text} from "@mantine/core";
import {IconCopy, IconDotsVertical, IconEdit, IconEye, IconTrash} from "@tabler/icons-react";
import {useI18n} from "../../i18n";

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

    const {t} = useI18n();
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
                    <ActionIcon variant="filled" aria-label={t("menuActions")} onClick={(event) => {
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
                            {t("menuEdit")}
                        </Menu.Item>
                    }
                    {onCopy &&
                        <Menu.Item
                            leftSection={<IconCopy size={14}/>}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onCopy(item);
                            }}
                        >
                            {t("menuCopy")}
                        </Menu.Item>
                    }
                    {onView &&
                        <Menu.Item
                            leftSection={<IconEye size={14}/>}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onView(item);
                            }}
                        >
                            {t("menuView")}
                        </Menu.Item>
                    }
                    {onDelete &&
                        <>
                            <Menu.Label>{t("menuDangerZone")}</Menu.Label>
                            <Menu.Item
                                color={"red"}
                                leftSection={<IconTrash size={14}/>}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    setShowConfirmDialog(true);
                                }}
                            >
                                {t("menuDelete")}
                            </Menu.Item>
                        </>
                    }
                </Menu.Dropdown>
            </Menu>
            <Modal opened={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} title={t("confirmDeleteTitle")}>
                <Text>{t("confirmDeleteText")}</Text>
                <Group mt={"md"} justify={"space-between"}>
                    <Button color={"red"} onClick={() => {
                        if (onDelete) {
                            setShowConfirmDialog(false);
                            onDelete(item);
                        }
                    }}>{t("yes")}</Button>
                    <Button onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setShowConfirmDialog(false);
                    }}>{t("cancel")}</Button>
                </Group>
            </Modal>
        </>
    )
}

export default QuickMenu