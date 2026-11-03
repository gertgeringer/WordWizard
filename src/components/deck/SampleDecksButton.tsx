import React, {useState} from "react";
import {Button, ButtonProps} from "@mantine/core";
import {IconSparkles} from "@tabler/icons-react";
import {message} from "@tauri-apps/api/dialog";
import {commands, Deck} from "../../bindings.ts";
import {useI18n} from "../../i18n";

interface SampleDecksButtonProps extends ButtonProps {
    onAdded: (decks: Deck[]) => void
}

/** Adds ready-made Grade 2 word decks, handy for trying the app out. */
const SampleDecksButton: React.FC<SampleDecksButtonProps> = ({onAdded, ...buttonProps}) => {

    const [adding, setAdding] = useState(false);
    const {t} = useI18n();

    return (
        <Button
            variant="default"
            leftSection={<IconSparkles size={18}/>}
            loading={adding}
            {...buttonProps}
            onClick={async () => {
                setAdding(true);
                const result = await commands.addSampleDecks();
                setAdding(false);
                if (result.status === "error") {
                    await message(result.error, {title: t("error")});
                } else if (result.data.length === 0) {
                    await message(t("sampleDecksAlreadyAdded"), {title: t("sampleDecksTitle")});
                } else {
                    onAdded(result.data);
                }
            }}
        >
            {t("addSampleDecks")}
        </Button>
    );
}

export default SampleDecksButton;
