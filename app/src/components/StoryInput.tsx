import { Button, Flex, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { Card } from "@teexid/shared";
import React, { useState } from "react";

import CardSelector from "./CardSelector";
import { CardView } from "./CardView";
import { useGameStore } from "../stores/GameStore";

export const StoryInput: React.FC = () => {
  const turnState = useGameStore((state) => state.room.turnState);
  const cards = useGameStore((state) => state.room.cards);
  const storyCards = useGameStore((state) => state.room.storyCards);
  const [storyText, setStoryText] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const send = useGameStore((s) => s.send);

  const submitStory = () => {
    if (storyText !== "" && selectedCard !== null) {
      send({
        type: "submit_story",
        payload: {
          story: storyText,
          cardId: selectedCard.cardId,
        },
      });
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Stack>
        <Text fontSize="lg" mb={5}>
          You submitted the story: <Text as="em">{storyText}</Text>
        </Text>
        <Text fontSize="lg" mb={5}>
          Your story card:
        </Text>
        {selectedCard && (
          <CardView card={{ cardId: selectedCard.cardId } as Card} />
        )}
        {turnState === "guessing" && (
          <Text fontSize="lg" mb={5}>
            Waiting for others to submit the cards
          </Text>
        )}
        {turnState === "voting" && (
          <>
            <Text fontSize="lg" mb={5}>
              Waiting for others to vote...
            </Text>
            {/*<Text>Others submitted:</Text>
            <CardSelector
              cards={storyCards.filter((c) => c.cardId !== storyCardSubmitted)}
        />*/}
          </>
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
        isDisabled={storyText.trim() === "" || selectedCard === null}
        onClick={() => submitStory()}
        my={5}
      >
        Submit story
      </Button>
    </Flex>
  );
};
