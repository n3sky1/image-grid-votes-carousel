
import { useState, useEffect } from "react";
import { ImageVotingGridProps } from "@/types/props";
import { useImageVoting } from "@/hooks/useImageVoting";
import VotingCompleted from "./VotingCompleted";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import RegeneratingOverlay from "./RegeneratingOverlay";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageVotingSectionLayout from "./ImageVotingSectionLayout";
import VotingSidebar from "./VotingSidebar";

const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

const ImageVotingGrid = ({ asin, suggestedTags = [], onVotingCompleted }: ImageVotingGridProps) => {
  const {
    originalImage,
    conceptImages,
    votedImages,
    setVotedImages,
    allVoted,
    loading,
    error,
    promptText,
    setPromptText,
    useTestData,
    toggleDataSource,
    repairedImages,
    setRepairedImages,
    fetchImages,
    showRegeneratingOverlay,
  } = useImageVoting(asin);

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [aiRecommendedModel, setAiRecommendedModel] = useState<string>("");

  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);

  useEffect(() => {
    const fetchVotingStats = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setUserCompletedCount(0);
          setTotalReadyCount(0);
          return;
        }
        const { count: readyCount } = await supabase
          .from("tshirts")
          .select("asin", { count: "exact", head: true })
          .eq("ready_for_voting", true);
        setTotalReadyCount(readyCount ?? 0);

        const { count: completedCount } = await supabase
          .from("completed_votings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        setUserCompletedCount(completedCount ?? 0);
      } catch (err) {
        setUserCompletedCount(0);
        setTotalReadyCount(0);
      }
    };
    fetchVotingStats();
  }, []);

  useEffect(() => {
    const fetchModel = async () => {
      const { data } = await supabase
        .from("tshirts")
        .select("ai_recommended_model")
        .eq("asin", asin)
        .maybeSingle();
      setAiRecommendedModel(data?.ai_recommended_model ?? "");
    };
    fetchModel();
  }, [asin]);

  const handleVote = async (id: string, vote: "like" | "dislike" | "love") => {
    try {
      // If the current vote is the same as the previous vote, we'll unselect it
      const currentVote = votedImages[id];
      const finalVote = currentVote === vote ? undefined : vote;

      // Call setVotedImages with both id and vote parameters
      await setVotedImages(id, finalVote);
      
      const voteText = finalVote 
        ? (finalVote === "like" ? "Liked" : finalVote === "dislike" ? "Disliked" : "Loved")
        : "Vote removed";
      
      toast(voteText, {
        description: finalVote 
          ? `You ${voteText.toLowerCase()} this image`
          : "Your previous vote was removed",
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

  useEffect(() => {
    if (allVoted && onVotingCompleted) {
      const recordCompletion = async () => {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        await supabase
          .from("completed_votings")
          .insert({
            asin: asin,
            user_id: user.data.user.id
          });
      };

      recordCompletion().then(() => {
        onVotingCompleted();
      });
    }
  }, [allVoted, asin, onVotingCompleted]);

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

export default ImageVotingGrid;
