import {ActionIcon, Card, Text, rem, Checkbox, Image} from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import React from "react";
import { convertFileSrc } from '@tauri-apps/api/tauri';

interface DeckCardProps {
    text: string,
    editable?: boolean,
    onDeleteCardClick?: () => void,
    selectable?: boolean
    checked?: boolean
    onChange?: (checked: boolean) => void,
    cardImagePath: string | null
}

const DeckCard: React.FC<DeckCardProps> = ({
                                               text,
                                               editable,
                                               onDeleteCardClick,
                                               selectable,
                                               checked,
                                               onChange,
                                               cardImagePath
}) => {
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
                <div
                    style={{
                        position: "absolute",
                        top: 5,
                        right: 5
                    }}
                >
                    <ActionIcon size={28} variant="default" onClick={onDeleteCardClick}>
                        <IconTrash style={{ width: rem(18), height: rem(18) }} />
                    </ActionIcon>
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
