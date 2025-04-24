
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
      // First, ensure the user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("Authentication required");
      }
      
      // Try to update the tshirt with the review problem
      try {
        // Update the tshirt with the review problem
        const { error: tshirtError } = await supabase
          .from('tshirts')
          .update({ 
            review_problem: action,
            ready_for_voting: false 
          })
          .eq('asin', id);
          
        if (tshirtError) {
          console.error("Error updating tshirt:", tshirtError);
        }
      } catch (updateError) {
        console.error("Update operation failed:", updateError);
      }
      
      // Always try to record completion regardless of the tshirt update result
      await recordCompletion(id, authData.user.id);

      toast.success('Problem reported', {
        description: 'This t-shirt has been marked for review.',
      });

      // Always call the onOriginalAction to move to the next t-shirt
      onOriginalAction(action);
    } catch (error) {
      console.error('Error updating tshirt:', error);
      toast.error('Error reporting problem', {
        description: 'Please try again later.',
      });
      
      // Even if there's an error, try to move to the next t-shirt
      onOriginalAction(action);
    }
  };
  
  const recordCompletion = async (asin: string, userId: string) => {
    try {
      const { error: completedError } = await supabase
        .from('completed_votings')
        .insert({ 
          asin: asin, 
          user_id: userId
        });

      if (completedError) {
        console.error("Error recording completion:", completedError);
      }
    } catch (err) {
      console.error("Failed to record completion:", err);
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
