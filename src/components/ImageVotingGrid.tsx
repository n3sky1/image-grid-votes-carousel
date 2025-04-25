
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
          // Call the callback immediately to ensure fast transition
          setTimeout(() => {
            onVotingCompleted();
          }, 200); // Short timeout to ensure UI updates first
        }
      }}
    />
  );
};

export default ImageVotingGrid;
