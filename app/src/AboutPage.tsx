import { Box, Text } from "@chakra-ui/react";

const AboutPage = () => {
  return (
    <>
      <Box color="white">
        <Text fontSize="2xl">About</Text>
        <Text>This is a remake of the game Dixit.</Text>
        <Text>You can play with friends by creating a room and sharing it</Text>
      </Box>

      <Box color="white" mt="2em">
        <Text fontSize="2xl">Scoring</Text>
        <Text>
          If everyone guesses the story card, all players, except the story
          teller, get 2 points.
        </Text>
        <Text>
          If nobody guesses the story card, all players, except the story
          teller, get 2 points.
        </Text>
        <Text>
          Every player who guesses the story card and the story teller will get
          3 points
        </Text>
        <Text>
          In addition - each vote for other player's card is worth 1 point
          (except the story teller).
        </Text>
      </Box>
    </>
  );
};

export default AboutPage;
