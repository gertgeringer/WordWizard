import {Button, Group, Modal, TextInput, Text, Image, CloseButton, Stack} from '@mantine/core';
import {useForm} from '@mantine/form';
import {message} from '@tauri-apps/api/dialog';
import React, {useState} from "react";
import {IconPhoto} from "@tabler/icons-react";
import {DeckCard, commands} from "../../bindings.ts";
import {convertFileSrc} from "@tauri-apps/api/tauri";
import {useI18n} from "../../i18n";
import {pickSvgPicture} from "../../utils/pictures.ts";

interface NewCardProps {
  deckId: number,
  opened: boolean
  close: () => void
}

const NewCard: React.FC<NewCardProps> = ({ opened, close, deckId }) => {

  const {t} = useI18n();

  const form = useForm({
    initialValues: {
      text: ''
    },

    validate: {
      text: (value) => (value.trim().length === 0 ? t("wordRequired") : null),
    },

  });

  const [cardImageFilePath, setCardImageFilePath] = useState<string | null>(null);

  const closeAndReset = () => {
    form.reset();
    setCardImageFilePath(null);
    close();
  }

  return (
      <Modal
          size="md"
          opened={opened}
          onClose={closeAndReset}
          title={<Text fw={700} size="lg">{t("addAWord")}</Text>}
          centered
      >
        <form onSubmit={form.onSubmit((values) => {
          let card: DeckCard = {
            deck_id: deckId,
            card_text: values.text.trim(),
            image_file_path: cardImageFilePath
          }
          commands.saveCardToDeck(card).then((result) => {
            if (result.status === "ok") {
              closeAndReset();
            } else {
              message(result.error, {title: t("error")});
            }
          });
        })}>
          <Stack>
            <TextInput
                data-autofocus
                size="lg"
                label={t("word")}
                placeholder={t("wordPlaceholder")}
                {...form.getInputProps('text')}
            />
            {cardImageFilePath &&
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Image h={100} w="auto" fit="contain" radius="md" src={convertFileSrc(cardImageFilePath)}/>
                  <CloseButton aria-label={t("removePicture")} onClick={() => setCardImageFilePath(null)}/>
                </Group>
            }
            <Text size="sm" c="dimmed">{t("pictureHint")}</Text>
            <Group justify={"space-between"}>
              <Button
                  leftSection={<IconPhoto size={16}/>} variant="default"
                  onClick={() => {
                    // Keep the current picture when the dialog is cancelled.
                    pickSvgPicture(t).then(path => path && setCardImageFilePath(path));
                  }}>{cardImageFilePath ? t("changePicture") : t("addPicture")}</Button>
              <Button type="submit" size="md">
                {t("saveWord")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
  );
}

export default NewCard
