import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface CopyButtonProps {
  copyText: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  copyText,
}: CopyButtonProps) => {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(copyText);
      }}
    >
      <FontAwesomeIcon icon={["far", "copy"]} />
    </button>
  );
};
