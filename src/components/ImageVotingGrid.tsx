
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
          // Call the callback immediately to ensure next t-shirt loading
          setTimeout(() => {
            onVotingCompleted();
          }, 100); // Small delay to ensure backend processes are complete
        }
      }}
    />
  );
};

export default ImageVotingGrid;
