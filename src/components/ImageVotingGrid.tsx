
import { ImageVotingGridProps } from "@/types/props";
import VotingSection from "./VotingSection";

const ImageVotingGrid = ({ asin, suggestedTags = [], onVotingCompleted }: ImageVotingGridProps) => {
  return (
    <VotingSection 
      asin={asin}
      suggestedTags={suggestedTags}
      onVotingCompleted={() => {
        console.log(`ImageVotingGrid: Voting completed for ASIN ${asin}, calling parent onVotingCompleted immediately`);
        if (onVotingCompleted) {
          // We'll call the callback immediately without a delay
          // This ensures fast transition to the next t-shirt
          onVotingCompleted();
        }
      }}
    />
  );
};

export default ImageVotingGrid;
