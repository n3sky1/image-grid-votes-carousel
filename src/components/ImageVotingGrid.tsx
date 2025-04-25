
import { ImageVotingGridProps } from "@/types/props";
import VotingSection from "./VotingSection";

const ImageVotingGrid = ({ asin, suggestedTags = [], onVotingCompleted }: ImageVotingGridProps) => {
  return (
    <VotingSection 
      asin={asin}
      suggestedTags={suggestedTags}
      onVotingCompleted={() => {
        console.log(`ImageVotingGrid: Voting completed for ASIN ${asin}, triggering callback`);
        if (onVotingCompleted) {
          onVotingCompleted();
        }
      }}
    />
  );
};

export default ImageVotingGrid;
