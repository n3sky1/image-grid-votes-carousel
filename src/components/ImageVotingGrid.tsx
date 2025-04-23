
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
  } = useImageVoting(asin);

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const handleVote = (id: string, vote: "like" | "dislike" | "love") => {
    setVotedImages((prev) => ({
      ...prev,
      [id]: vote,
    }));
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
          onVote={handleVote}
          originalImage={originalImage}
        />
      </div>
    </div>
  );
};

export default ImageVotingGrid;
