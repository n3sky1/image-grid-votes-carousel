
import { ImageVotingGridProps } from "@/types/props";
import { useImageVoting } from "@/hooks/useImageVoting";
import VotingCompleted from "./VotingCompleted";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImageVotingSectionLayout from "./ImageVotingSectionLayout";
import PromptEditor from "./PromptEditor";
import VotingSidebar from "./VotingSidebar";

const ImageVotingGrid = ({ asin, suggestedTags = [] }: ImageVotingGridProps) => {
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
    toggleDataSource,
    repairedImages, // We'll let UI manage this state for consistency
    setRepairedImages,
  } = useImageVoting(asin);

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // Handle voting logic
  const handleVote = async (id: string, vote: "like" | "dislike" | "love") => {
    // Previous vote for this image (if any)
    const prevVote = votedImages[id];

    // Optimistically update UI
    setVotedImages((prev) => ({
      ...prev,
      [id]: vote,
    }));

    // Prepare DB field changes
    const fields: Partial<Record<string, number>> = {};
    if (prevVote && prevVote !== vote) {
      // Decrement previous vote count
      if (prevVote === "like") fields.votes_up = -1;
      if (prevVote === "dislike") fields.votes_down = -1;
      if (prevVote === "love") fields.hearts = -1;
    }
    // Increment new vote count
    if (vote === "like") fields.votes_up = (fields.votes_up ?? 0) + 1;
    if (vote === "dislike") fields.votes_down = (fields.votes_down ?? 0) + 1;
    if (vote === "love") fields.hearts = (fields.hearts ?? 0) + 1;

    // Update in Supabase
    const updates: any = { ...fields };
    await supabase
      .from("concepts")
      .update(updates)
      .eq("concept_id", id);

    // Show toast for feedback
    const voteText = vote === "like" ? "Liked" : vote === "dislike" ? "Disliked" : "Loved";
    toast(voteText, {
      description: `You ${voteText.toLowerCase()} this image`,
      position: "bottom-right",
    });
  };

  // Handle Repair action (toggle, independent from vote)
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
  };

  if (loading) return <VotingLoading />;
  if (error) return <VotingError error={error} />;
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  const tagsToUse = suggestedTags.length > 0 ? suggestedTags : ["Funny", "Vintage", "Graphic", "Summer"];

  return (
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
            />
          }
          right={
            <>
              <PromptEditor
                asin={asin}
                promptText={promptText}
                onPromptSaved={() => setIsEditingPrompt(false)}
              />
              <VotingSidebar
                votedImages={votedImages}
                conceptImagesCount={conceptImages.length}
                useTestData={useTestData}
                toggleDataSource={toggleDataSource}
              />
            </>
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
  );
};

export default ImageVotingGrid;
