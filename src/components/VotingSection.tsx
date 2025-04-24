import { useState } from "react";
import { useVotingStats } from "@/hooks/useVotingStats";
import { useAiModel } from "@/hooks/useAiModel";
import { useImageVoting } from "@/hooks/useImageVoting";
import { useVotingActions } from "./voting/VotingActionsHandler";
import { useVotingRealtime } from "@/hooks/useVotingRealtime";
import ImageVotingSectionLayout from "./ImageVotingSectionLayout";
import OriginalImageSection from "./OriginalImageSection";
import VotingSidebar from "./VotingSidebar";
import ConceptImagesGrid from "./ConceptImagesGrid";
import { VotingStateHandlers } from "./voting/VotingStateHandlers";
import VotingHeader from "./VotingHeader";

interface VotingSectionProps {
  asin: string;
  suggestedTags?: string[];
  onVotingCompleted?: () => void;
}

const VotingSection = ({ asin, onVotingCompleted }: VotingSectionProps) => {
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
    setShowRegeneratingOverlay,
    setRegenerating
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

  const { showWinningVoteOverlay } = useVotingRealtime({
    asin,
    onVotingCompleted,
    setShowRegeneratingOverlay,
    setRegenerating,
    fetchImages
  });

  const handleRepairImage = (id: string) => {
    setRepairedImages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      <VotingStateHandlers
        loading={loading}
        error={error}
        allVoted={allVoted}
        votedImages={votedImages}
        showRegeneratingOverlay={showRegeneratingOverlay}
        showWinningVoteOverlay={showWinningVoteOverlay}
        asin={asin}
        onVotingCompleted={onVotingCompleted}
        onRetry={handleRetry}
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
      </VotingStateHandlers>
    </>
  );
};

export default VotingSection;
