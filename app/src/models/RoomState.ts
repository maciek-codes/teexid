import Card from "./Card";

export type TurnStatus = 'writingStory' | 'waitingForStory' |
  'submittingCard' | 'waitingForOthers' | 'voting' | 'voted';

export interface TurnState {
  storyPlayerId: string,
  turnStatus: TurnStatus
  storyPrompt: string,
  storyCard: Card,
  pickedCardId: string,
  cardsToVote: string
}
