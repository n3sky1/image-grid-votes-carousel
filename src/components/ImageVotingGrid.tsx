
import { ImageVotingGridProps } from "@/types/props";
import VotingSection from "./VotingSection";

const ImageVotingGrid = ({ asin, suggestedTags = [], onVotingCompleted }: ImageVotingGridProps) => {
  return (
    <VotingSection 
      asin={asin}
      suggestedTags={suggestedTags}
      onVotingCompleted={() => {
        console.log(`ImageVotingGrid: Voting completed for ASIN ${asin}, calling parent onVotingCompleted`);
        if (onVotingCompleted) {
          // Call the callback without delay to ensure immediate transition
          onVotingCompleted();
        }
      }}
    />
  );
};

export default ImageVotingGrid;
