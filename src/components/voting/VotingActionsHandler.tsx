
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
      // For love votes, handle special case - we won't show a toast here as it's in VoteCard
      if (vote === "love") {
        await onVote(id, vote);
        // Don't show toast here as we already show it in VoteCard
        return;
      }
      
      // For other votes, do the standard flow
      await onVote(id, vote);
      
      let voteText = vote === "like" ? "Liked" : "Disliked";
      toast(voteText, {
        description: `You ${voteText.toLowerCase()} this image`,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error setting vote:", error);
      toast.error("Failed to save vote", {
        description: "Please try again later.",
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
      
      // Try to update the tshirt with the review problem and record completion regardless of result
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

      // Always call the onOriginalAction to move to the next t-shirt with small delay
      setTimeout(() => {
        onOriginalAction(action);
      }, 300);
    } catch (error) {
      console.error('Error updating tshirt:', error);
      toast.error('Error reporting problem', {
        description: 'Please try again later.',
      });
      
      // Even if there's an error, try to move to the next t-shirt after a delay
      setTimeout(() => {
        onOriginalAction(action);
      }, 300);
    }
  };
  
  const recordCompletion = async (asin: string, userId: string) => {
    try {
      const { error: completedError } = await supabase
        .from('completed_votings')
        .upsert({ 
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
