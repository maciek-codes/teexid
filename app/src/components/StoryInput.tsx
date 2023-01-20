import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import CardSelector from "./CardSelector";
import { useRoom } from "../contexts/RoomContext";
import { useSocket } from "../contexts/WebsocketContext";
import Card from "../models/Card";
import { useSubmitStory } from "../queries/useSubmitStory";
import CardView from "./CardView";

export const StoryInput: React.FC = () => {
  const { sendCommand } = useSocket();
  const { roomId, turnState, cards, storyCards } = useRoom();
  const [storyText, setStoryText] = useState<string>("");
  const submitQuery = useSubmitStory();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const submitStory = useCallback(() => {
    if (storyText !== "" && selectedCard !== null) {
      submitQuery.mutate({
        story: storyText,
        cardId: selectedCard.cardId,
      });
    }
  }, [roomId, sendCommand, storyText, selectedCard]);

  if (submitQuery.isSuccess) {
    return (
      <Stack>
        <Text fontSize="lg" mb={5}>
          You submitted the story: <Text as="em">{submitQuery.data.story}</Text>
        </Text>
        <Text fontSize="lg" mb={5}>
          Your story card:
        </Text>
        <CardView card={{ cardId: submitQuery.data.cardId } as Card} />
        {turnState === "selecting_cards" && (
          <Text fontSize="lg" mb={5}>
            Waiting for others to submit the cards
          </Text>
        )}
        {turnState === "voting" && (
          <Text fontSize="lg" mb={5}>
            Waiting for others to vote...
          </Text>
        )}
      </Stack>
    );
  }

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
