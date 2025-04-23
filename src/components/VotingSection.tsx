
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import VotingCompleted from "./VotingCompleted";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import RegeneratingOverlay from "./RegeneratingOverlay";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import ImageVotingSectionLayout from "./ImageVotingSectionLayout";
import VotingSidebar from "./VotingSidebar";
import VotingCompletionHandler from "./VotingCompletionHandler";
import { useVotingStats } from "@/hooks/useVotingStats";
import { useAiModel } from "@/hooks/useAiModel";
import { useImageVoting } from "@/hooks/useImageVoting";
import { supabase } from "@/integrations/supabase/client";

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

  const handleVote = async (id: string, vote: "like" | "dislike" | "love") => {
    try {
      const currentVote = votedImages[id];
      
      await setVotedImages(id, vote);
      
      let voteText: string;
      let voteDescription: string;
      
      if (currentVote === vote) {
        voteText = "Vote removed";
        voteDescription = "Your previous vote was removed";
      } else if (currentVote && currentVote !== vote) {
        voteText = vote === "like" ? "Liked" : vote === "dislike" ? "Disliked" : "Loved";
        voteDescription = `Vote changed from ${currentVote} to ${vote}`;
      } else {
        voteText = vote === "like" ? "Liked" : vote === "dislike" ? "Disliked" : "Loved";
        voteDescription = `You ${voteText.toLowerCase()} this image`;
      }
      
      toast(voteText, {
        description: voteDescription,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error setting vote:", error);
      toast("Error", {
        description: "Failed to save your vote. Please try again.",
        position: "bottom-right",
      });
    }
  };

  const handleRepair = async (id: string) => {
    const alreadyMarked = repairedImages[id];
    setRepairedImages(prev => ({
      ...prev,
      [id]: !alreadyMarked
    }));
    await supabase
      .from('concepts')
      .update({ repair_requested: !alreadyMarked })
      .eq('concept_id', id);

    toast(`${alreadyMarked ? "Unmarked" : "Marked"} for repair`, {
      description: `${alreadyMarked ? "Repair unmarked" : "Repair requested"}`,
      position: 'bottom-right'
    });
  };

  const handleOriginalAction = (action: "copyrighted" | "no-design" | "cant-design") => {
    const actionMessages = {
      copyrighted: "Marked as Copyrighted!",
      "no-design": "Marked as No Design!",
      "cant-design": "Marked as Can't Design!",
    };

    toast(actionMessages[action], {
      description: `You selected: ${actionMessages[action].replace("Marked as ", "")}`,
      position: "bottom-right",
    });
    
    if (onVotingCompleted) {
      onVotingCompleted();
    }
  };

  const handleRetry = () => {
    toast("Retrying...", {
      description: "Attempting to reload images",
      position: "bottom-right"
    });
    fetchImages();
  };

  const handlePromptSaved = (newPrompt: string) => {
    setPromptText(newPrompt);
    fetchImages();
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
    <>
      <VotingCompletionHandler 
        allVoted={allVoted} 
        asin={asin} 
        onVotingCompleted={onVotingCompleted} 
      />
      {showRegeneratingOverlay && <RegeneratingOverlay />}
      <div className="w-full max-w-6xl mx-auto">
        <div className="p-4 space-y-8">
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
            onRepair={handleRepair}
            originalImage={originalImage}
          />
        </div>
      </div>
    </>
  );
};

export default VotingSection;
