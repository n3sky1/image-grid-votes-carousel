
import { ImageVotingGridProps } from "@/types/props";
import { useImageVoting } from "@/hooks/useImageVoting";
import VotingCompleted from "./VotingCompleted";
import VotingProgress from "./VotingProgress";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import { Card } from "@/components/ui/card";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import { toast } from "@/components/ui/sonner";

const ImageVotingGrid = ({ asin }: { asin: string }) => {
  const {
    originalImage,
    conceptImages,
    votedImages,
    setVotedImages,
    allVoted,
    loading,
    error,
    promptText,
    useTestData,
    toggleDataSource
  } = useImageVoting(asin);

  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    setVotedImages(prev => ({
      ...prev,
      [id]: vote
    }));
  };

  const handleOriginalAction = (action: "copyrighted" | "no-design" | "cant-design") => {
    const actionMessages = {
      "copyrighted": "Marked as Copyrighted!",
      "no-design": "Marked as No Design!",
      "cant-design": "Marked as Can't Design!"
    };
    
    toast(actionMessages[action], {
      description: `You selected: ${actionMessages[action].replace("Marked as ", "")}`,
      position: "bottom-right",
    });
  };

  const handleEditPrompt = () => {
    toast("Edit Prompt clicked!", {
      description: "This feature is under development.",
      position: "bottom-right",
    });
  };

  if (loading) return <VotingLoading />;
  if (error) return <VotingError error={error} />;
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="p-4 space-y-8">
        <Card className="overflow-hidden shadow-lg border-0">
          <div className="space-y-6 p-6">
            <OriginalImageSection
              originalImage={originalImage}
              promptText={promptText}
              onOriginalAction={handleOriginalAction}
              onEditPrompt={handleEditPrompt}
              onToggleDataSource={toggleDataSource}
              useTestData={useTestData}
            />
            <VotingProgress 
              votedImages={votedImages} 
              conceptImagesCount={conceptImages.length} 
            />
          </div>
        </Card>
        <ConceptImagesGrid
          conceptImages={conceptImages}
          votedImages={votedImages}
          onVote={handleVote}
        />
      </div>
    </div>
  );
};

export default ImageVotingGrid;
