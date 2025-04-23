
import { useState } from "react";
import VotingCompleted from "./VotingCompleted";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import ImageVotingSectionLayout from "./ImageVotingSectionLayout";
import VotingSidebar from "./VotingSidebar";
import { useVotingStats } from "@/hooks/useVotingStats";
import { useAiModel } from "@/hooks/useAiModel";
import { useImageVoting } from "@/hooks/useImageVoting";
import { VotingLayout } from "./voting/VotingLayout";
import { useVotingActions } from "./voting/VotingActionsHandler";

interface VotingSectionProps {
  asin: string;
  suggestedTags?: string[];
  onVotingCompleted?: () => void;
}

const VotingSection = ({ asin, suggestedTags = [], onVotingCompleted }: VotingSectionProps) => {
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const { userCompletedCount, totalReadyCount } = useVotingStats();
  const aiRecommendedModel = useAiModel(asin);

  const {
    originalImage,
    conceptImages,
    votedImages,
    setVotedImages,
    repairedImages,
    setRepairedImages,
    allVoted,
    loading,
    error,
    promptText,
    setPromptText,
    useTestData,
    toggleDataSource,
    fetchImages,
    showRegeneratingOverlay,
  } = useImageVoting(asin);

  const {
    handleVote,
    handleOriginalAction,
    handleRetry,
    handlePromptSaved
  } = useVotingActions({
    id: asin,
    onVote: setVotedImages,
    onOriginalAction: (action) => {
      handleOriginalAction(action);
      if (onVotingCompleted) onVotingCompleted();
    },
    onRetry: fetchImages,
    onPromptSaved: (newPrompt: string) => {
      setPromptText(newPrompt);
      fetchImages();
    }
  });

  // Create a handler function to properly update repairedImages state
  const handleRepairImage = (id: string) => {
    setRepairedImages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) return <VotingLoading />;
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <VotingError error={error} onRetry={handleRetry} />
      </div>
    );
  }
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  return (
    <VotingLayout
      showRegeneratingOverlay={showRegeneratingOverlay}
      allVoted={allVoted}
      asin={asin}
      onVotingCompleted={onVotingCompleted}
    >
      <ImageVotingSectionLayout
        left={
          <OriginalImageSection
            originalImage={originalImage}
            promptText={promptText}
            onOriginalAction={handleOriginalAction}
            onEditPrompt={() => setIsEditingPrompt(true)}
            onToggleDataSource={toggleDataSource}
            useTestData={useTestData}
            totalReadyCount={totalReadyCount}
            userCompletedCount={userCompletedCount}
          />
        }
        right={
          <VotingSidebar
            votedImages={votedImages}
            conceptImagesCount={conceptImages.length}
            useTestData={useTestData}
            toggleDataSource={toggleDataSource}
            promptText={promptText}
            asin={asin}
            onPromptSaved={handlePromptSaved}
            isEditingPrompt={isEditingPrompt}
            setIsEditingPrompt={setIsEditingPrompt}
            aiRecommendedModel={aiRecommendedModel}
          />
        }
      />
      <ConceptImagesGrid
        conceptImages={conceptImages}
        votedImages={votedImages}
        repairedImages={repairedImages}
        onVote={handleVote}
        onRepair={handleRepairImage}
        originalImage={originalImage}
      />
    </VotingLayout>
  );
};

export default VotingSection;
