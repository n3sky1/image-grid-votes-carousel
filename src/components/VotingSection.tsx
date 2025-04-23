
import { useState, useEffect } from "react";
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
import WinningVoteOverlay from "./WinningVoteOverlay";
import { supabase } from "@/integrations/supabase/client";

interface VotingSectionProps {
  asin: string;
  suggestedTags?: string[];
  onVotingCompleted?: () => void;
}

const VotingSection = ({ asin, suggestedTags = [], onVotingCompleted }: VotingSectionProps) => {
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [showWinningOverlay, setShowWinningOverlay] = useState(false);
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
    setShowRegeneratingOverlay
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

  const handleRepairImage = (id: string) => {
    setRepairedImages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    // Enable postgreSQL changes for the tshirts table at the Supabase level
    const tshirtChangesChannel = supabase
      .channel('tshirt-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tshirts',
          filter: `asin=eq.${asin}`,
        },
        (payload: any) => {
          console.log("Tshirt change detected:", payload);
          
          // Check if winning_concept_id changed from null to a value (winner selected)
          if (
            payload.old && 
            payload.new && 
            payload.old.winning_concept_id === null && 
            payload.new.winning_concept_id !== null
          ) {
            console.log("Winner detected! Showing overlay");
            setShowWinningOverlay(true);
            setTimeout(() => {
              if (onVotingCompleted) {
                onVotingCompleted();
              }
            }, 2000);
          }
          
          // Check if regenerate flag was set
          if (
            payload.old && 
            payload.new && 
            !payload.old.regenerate && 
            payload.new.regenerate
          ) {
            console.log("Regeneration flag detected. Showing overlay");
            setShowRegeneratingOverlay(true);
          }
        }
      )
      .subscribe();
      
    // Also listen specifically for concept vote changes that might trigger a winner
    const conceptChangesChannel = supabase
      .channel('concept-votes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'concepts',
          filter: `tshirt_asin=eq.${asin}`,
        },
        (payload: any) => {
          console.log("Concept vote change detected:", payload);
          
          // Check if votes_up >= 2 or hearts >= 1 (winning conditions)
          if (
            payload.new && 
            ((payload.new.votes_up >= 2) || (payload.new.hearts >= 1))
          ) {
            console.log("Potential winner based on vote count. Refreshing data");
            // Instead of immediately showing overlay, refresh data
            // The tshirt channel will catch if a winner was truly declared
            fetchImages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tshirtChangesChannel);
      supabase.removeChannel(conceptChangesChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, fetchImages]);

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
    <>
      {showWinningOverlay && <WinningVoteOverlay />}
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
    </>
  );
};

export default VotingSection;
