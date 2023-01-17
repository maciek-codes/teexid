import { Button, Flex, Input, Text } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import CardSelector from "./CardSelector";
import { useRoom } from "../contexts/RoomContext";
import { useSocket } from "../contexts/WebsocketContext";
import Card from "../models/Card";

type StoryPromptInputProps = {
  cards: Array<Card>;
  selectedCard: Card | null;
  setSelectedCard: (c: Card | null) => void;
};

const StoryInput: React.FC<StoryPromptInputProps> = ({
  cards,
  selectedCard,
  setSelectedCard,
}) => {
  const { sendCommand } = useSocket();
  const { roomId } = useRoom();
  const [storyText, setStoryText] = useState<string>("");
  const submitStory = useCallback(() => {
    if (storyText !== "" && selectedCard !== null) {
      sendCommand({
        type: "player/story",
        data: {
          roomId,
          story: storyText,
          cardId: selectedCard.cardId,
        },
      });
    }
  }, [roomId, sendCommand, storyText, selectedCard]);

  return (
    <Flex flexDirection="column" alignItems="start" justifyContent="start">
      <Text fontSize="lg" mt={5} mb={10}>
        Pick a card and type your story:
      </Text>
      <CardSelector
        cards={cards}
        onSelected={(selectedCard) => {
          setSelectedCard(selectedCard);
        }}
      />
      <Input
        type="text"
        background="white"
        placeholder="Be creative!"
        onChange={(e) => setStoryText(e.currentTarget.value)}
        mt={5}
        mb={10}
      />
      <Button
        isActive={storyText.trim() !== "" && selectedCard !== null}
        isDisabled={storyText.trim() === "" || selectedCard === null}
        onClick={() => submitStory()}
      >
        Submit story
      </Button>
    </Flex>
  );
};

export default StoryInput;
