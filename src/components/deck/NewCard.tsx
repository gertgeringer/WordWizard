import {Button, Group, Modal, Textarea, Title, Image} from '@mantine/core';
import {useForm} from '@mantine/form';
import { open } from '@tauri-apps/api/dialog';
import React, {useState} from "react";
import {IconImageInPicture} from "@tabler/icons-react";
import {DeckCard, commands} from "../../bindings.ts";
import {convertFileSrc} from "@tauri-apps/api/tauri";

interface NewCardProps {
  deckId: number,
  opened: boolean
  close: () => void
}

const NewCard: React.FC<NewCardProps> = ({ opened, close, deckId }) => {

  const form = useForm({
    initialValues: {
      text: ''
    },

    validate: {
      text: (value) => (value.length === 0 ? 'The card does not contain any text' : null),
    },

  });

  const [cardImageFilePath, setCardImageFilePath] = useState<string>();

  return (
      <Modal
          size="sm"
          opened={opened}
          onClose={() => {
            setCardImageFilePath(undefined);
            close();
          }}
          title="New Card"
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
      >
        <form onSubmit={form.onSubmit((form) => {
          let card: DeckCard = {
            deck_id: deckId,
            card_text: form.text,
            image_file_path: cardImageFilePath as any
          }
          commands.saveCardToDeck(card).then(() => {
            form.text = '';
            setCardImageFilePath(undefined);
            close();
          });
        })}>
          <Title order={4}>Text</Title>
          <Textarea data-autofocus
                    autosize
                    minRows={4}
                    maxRows={10}
                    {...form.getInputProps('text')}
          />
          {cardImageFilePath &&
              <>
                <Title mt={"md"} order={4}>Image</Title>
                <Image
                    h={100}
                    w="auto"
                    fit="contain"
                    src={convertFileSrc(cardImageFilePath)} />
              </>
          }
          <Group justify={"space-between"} mt="xl">
            <Group>
              <Button
                  leftSection={<IconImageInPicture size={14}/>} variant="default"
                  onClick={() => {
                    open({
                        multiple: false,
                        directory: false,
                      filters:[{
                        name: 'Images',
                        extensions: ['jpg', 'jpeg', 'png']
                      }]
                    }).then((result) => {
                      setCardImageFilePath(result as any);
                    });
                  }}>Add Image</Button>
            </Group>
            <Button type="submit">
              Save
            </Button>
          </Group>
        </form>
      </Modal>
  );
}

export default NewCard
