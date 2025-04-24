
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface VotingActionsHandlerProps {
  id: string;
  onVote: (id: string, vote: "like" | "dislike" | "love") => void;
  onOriginalAction: (action: "copyrighted" | "no-design" | "cant-design") => void;
  onRetry: () => void;
  onPromptSaved: (newPrompt: string) => void;
}

export const useVotingActions = ({
  id,
  onVote,
  onOriginalAction,
  onRetry,
  onPromptSaved,
}: VotingActionsHandlerProps) => {
  const handleVote = async (id: string, vote: "like" | "dislike" | "love") => {
    try {
      await onVote(id, vote);
      
      let voteText = vote === "like" ? "Liked" : vote === "dislike" ? "Disliked" : "Loved";
      toast(voteText, {
        description: `You ${voteText.toLowerCase()} this image`,
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

  const handleOriginalAction = async (action: "copyrighted" | "no-design" | "cant-design") => {
    try {
      // Instead of updating the tshirt directly, we'll mark it as completed with a reason
      const { error } = await supabase
        .from('completed_votings')
        .insert({ 
          asin: id, 
          user_id: (await supabase.auth.getUser()).data.user?.id,
          reason: action 
        });

      if (error) throw error;

      toast.success('Problem reported', {
        description: 'This t-shirt has been marked for review.',
      });

      onOriginalAction(action);
    } catch (error) {
      console.error('Error reporting problem:', error);
      toast.error('Error reporting problem', {
        description: 'Please try again later.',
      });
    }
  };

  const handleRetry = () => {
    toast("Retrying...", {
      description: "Attempting to reload images",
      position: "bottom-right"
    });
    onRetry();
  };

  const handlePromptSaved = (newPrompt: string) => {
    onPromptSaved(newPrompt);
  };

  return {
    handleVote,
    handleOriginalAction,
    handleRetry,
    handlePromptSaved,
  };
};
