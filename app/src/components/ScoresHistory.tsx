import React from "react";

import { useGameStore } from "../stores/GameStore";
import { ScoresList } from "./ScoresList";

export const ScoresHistory = (): JSX.Element => {
  const scores = Array.from(useGameStore((s) => s.room.scores) ?? []);

  return (
    <>
      {scores !== null &&
        scores
          .reverse()
          .map((turnScores, idx) => (
            <ScoresList
              key={`turns-${idx}`}
              round={scores.length - idx}
              scores={turnScores}
            />
          ))}
    </>
  );
};
