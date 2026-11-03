import {ActionIcon, Card, Text, rem, Checkbox, Image, Menu} from "@mantine/core"
import {
    IconArrowLeft,
    IconArrowRight,
    IconDotsVertical,
    IconEdit,
    IconPhotoOff,
    IconPhotoPlus,
    IconTrash
} from "@tabler/icons-react"
import React from "react";
import { convertFileSrc } from '@tauri-apps/api/tauri';
import {useI18n} from "../../i18n";

interface DeckCardProps {
    text: string,
    editable?: boolean,
    onDeleteCardClick?: () => void,
    onEdit?: () => void,
    onMoveLeft?: () => void,
    onMoveRight?: () => void,
    onChoosePicture?: () => void,
    onRemovePicture?: () => void,
    selectable?: boolean
    checked?: boolean
    onChange?: (checked: boolean) => void,
    cardImagePath: string | null
}

const DeckCard: React.FC<DeckCardProps> = ({
                                               text,
                                               editable,
                                               onDeleteCardClick,
                                               onEdit,
                                               onMoveLeft,
                                               onMoveRight,
                                               onChoosePicture,
                                               onRemovePicture,
                                               selectable,
                                               checked,
                                               onChange,
                                               cardImagePath
}) => {
    const {t} = useI18n();
    return (
        <Card withBorder radius="md" style={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {cardImagePath &&
                <Image
                    h={70}
                    w="auto"
                    fit="contain"
                    src={convertFileSrc(cardImagePath)}
                />
            }

            <Text style={{ alignContent: "center" }}>{text}</Text>
            {editable &&
                <div style={{ position: "absolute", top: 5, right: 5 }}>
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon size={28} variant="default" aria-label={t("wordOptions")}>
                                <IconDotsVertical style={{ width: rem(18), height: rem(18) }} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {onEdit &&
                                <Menu.Item leftSection={<IconEdit size={16}/>} onClick={onEdit}>{t("editWord")}</Menu.Item>
                            }
                            {onMoveLeft &&
                                <Menu.Item leftSection={<IconArrowLeft size={16}/>} onClick={onMoveLeft}>{t("moveLeft")}</Menu.Item>
                            }
                            {onMoveRight &&
                                <Menu.Item leftSection={<IconArrowRight size={16}/>} onClick={onMoveRight}>{t("moveRight")}</Menu.Item>
                            }
                            {onChoosePicture &&
                                <Menu.Item leftSection={<IconPhotoPlus size={16}/>} onClick={onChoosePicture}>
                                    {cardImagePath ? t("changePicture") : t("addPictureToWord")}
                                </Menu.Item>
                            }
                            {cardImagePath && onRemovePicture &&
                                <Menu.Item leftSection={<IconPhotoOff size={16}/>} onClick={onRemovePicture}>
                                    {t("removePicture")}
                                </Menu.Item>
                            }
                            {onDeleteCardClick &&
                                <>
                                    <Menu.Divider/>
                                    <Menu.Item color="red" leftSection={<IconTrash size={16}/>} onClick={onDeleteCardClick}>
                                        {t("deleteWord")}
                                    </Menu.Item>
                                </>
                            }
                        </Menu.Dropdown>
                    </Menu>
                </div>
            }
            {selectable && onChange &&
                <div
                    style={{
                        position: "absolute",
                        top: 5,
                        right: 5
                    }}
                >
                    <Checkbox checked={checked} onChange={(evt) => onChange(evt.target.checked)}></Checkbox>
                </div>
            }
        </Card>
    )
}

export default DeckCard
