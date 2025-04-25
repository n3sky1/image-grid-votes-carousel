
import { ImageVotingGridProps } from "@/types/props";
import VotingSection from "./VotingSection";

const ImageVotingGrid = ({ asin, suggestedTags = [], onVotingCompleted }: ImageVotingGridProps) => {
  return (
    <VotingSection 
      asin={asin}
      suggestedTags={suggestedTags}
      onVotingCompleted={() => {
        console.log(`ImageVotingGrid: Voting completed for ASIN ${asin}, triggering callback immediately`);
        if (onVotingCompleted) {
          // Call the callback immediately without delay
          onVotingCompleted();
        }
      }}
    />
  );
};

export default ImageVotingGrid;
