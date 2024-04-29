export type GameLogEntryCard = {
  playerSubmitted: string;
  cardId: number;
  playersVoted: string[];
};

export type GameLogEntry = {
  story: string;
  storyPlayerId: string;
  storyCard: number;
  cardsSubmitted: Map<number, GameLogEntryCard>;
  allVotesForStory: boolean;
  noVotesForStory: boolean;
};
