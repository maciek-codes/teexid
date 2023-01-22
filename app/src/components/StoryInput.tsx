import { Button, Flex, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import CardSelector from "./CardSelector";
import { useRoom } from "../contexts/RoomContext";
import Card from "../models/Card";
import { useSubmitStory } from "../queries/useSubmitStory";
import CardView from "./CardView";

export const StoryInput: React.FC = () => {
  const { turnState, cards } = useRoom();
  const [storyText, setStoryText] = useState<string>("");
  const submitQuery = useSubmitStory();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const submitStory = () => {
    if (storyText !== "" && selectedCard !== null) {
      submitQuery.mutate({
        story: storyText,
        cardId: selectedCard.cardId,
      });
    }
  };

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
      <CardSelector
        cards={cards}
        onSelected={(selectedCard) => {
          setSelectedCard(selectedCard);
        }}
      />
      <FormLabel mt={5} htmlFor="storyText">
        Type your story here:
      </FormLabel>
      <Input
        id="storyText"
        type="text"
        background="white"
        placeholder="Be creative!"
        onChange={(e) => setStoryText(e.currentTarget.value)}
      />
      <Button
        alignSelf="center"
        background="gray.200"
        isActive={storyText.trim() !== "" && selectedCard !== null}
        isLoading={submitQuery.isLoading}
        isDisabled={storyText.trim() === "" || selectedCard === null}
        onClick={() => submitStory()}
        my={5}
      >
        Submit story
      </Button>
      {submitQuery.isError && (
        <Text>
          Something went wrong: {(submitQuery.error as Error).toString()}
        </Text>
      )}
    </Flex>
  );
};
