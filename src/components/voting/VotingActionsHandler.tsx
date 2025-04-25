
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
      console.log(`VotingActionsHandler: handleVote called for ${id} with vote: ${vote}`);
      
      // For love votes, we need special handling to ensure transition happens immediately
      if (vote === "love") {
        console.log(`VotingActionsHandler: Processing love vote for ${id} - this should trigger immediate transition`);
        toast.success("Finalizing this design!", {
          description: "Moving to next t-shirt...",
          duration: 1000,
        });
      }
      
      // Try to submit the vote - this is done optimistically, so UI transitions even if DB fails
      try {
        await onVote(id, vote);
      } catch (voteError) {
        console.error("VotingActionsHandler: Error in vote submission:", voteError);
        // We'll continue with the UI flow even if there's a backend error
      }
      
      // For love votes, we don't show a toast here as it's handled above
      if (vote !== "love") {
        const voteText = vote === "like" ? "Liked" : "Disliked";
        toast(voteText, {
          description: `You ${voteText.toLowerCase()} this image`,
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("VotingActionsHandler: Error setting vote:", error);
      toast.error("Failed to save vote", {
        description: "Please try again later.",
        position: "bottom-right",
      });
    }
  };

  const handleOriginalAction = async (action: "copyrighted" | "no-design" | "cant-design") => {
    console.log(`VotingActionsHandler: handleOriginalAction called with action: ${action}`);
    try {
      // First, ensure the user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.error("VotingActionsHandler: Authentication error:", authError);
        throw new Error("Authentication required");
      }
      
      // Update the tshirt with the review problem and mark as not ready for voting
      console.log(`VotingActionsHandler: Updating tshirt ${id} with problem: ${action}`);
      const { error: tshirtError } = await supabase
        .from('tshirts')
        .update({ 
          review_problem: action,
          ready_for_voting: false 
        })
        .eq('asin', id);
          
      if (tshirtError) {
        console.error("VotingActionsHandler: Error updating tshirt:", tshirtError);
      }
      
      // Record completion
      console.log(`VotingActionsHandler: Recording completion for ASIN: ${id}`);
      await recordCompletion(id, authData.user.id);

      toast.success('Moving to next t-shirt...', {
        duration: 1000,
      });

      console.log(`VotingActionsHandler: Calling onOriginalAction for ${action}`);
      // Call the onOriginalAction immediately
      onOriginalAction(action);
    } catch (error) {
      console.error('VotingActionsHandler: Error updating tshirt:', error);
      toast.error('Moving to next t-shirt', {
        description: 'Continuing despite error',
        duration: 1000,
      });
      
      // Even if there's an error, try to move to the next t-shirt
      console.log(`VotingActionsHandler: Calling onOriginalAction despite error for ${action}`);
      onOriginalAction(action);
    }
  };
  
  const recordCompletion = async (asin: string, userId: string) => {
    console.log(`VotingActionsHandler: recordCompletion called for ASIN: ${asin}, userId: ${userId}`);
    try {
      const { error: completedError } = await supabase
        .from('completed_votings')
        .upsert({ 
          asin: asin, 
          user_id: userId
        });

      if (completedError) {
        console.error("VotingActionsHandler: Error recording completion:", completedError);
      } else {
        console.log(`VotingActionsHandler: Successfully recorded completion for ASIN: ${asin}`);
      }
    } catch (err) {
      console.error("VotingActionsHandler: Failed to record completion:", err);
    }
  };

  const handleRetry = () => {
    console.log("VotingActionsHandler: handleRetry called");
    toast("Retrying...", {
      description: "Attempting to reload images",
      position: "bottom-right"
    });
    onRetry();
  };

  const handlePromptSaved = (newPrompt: string) => {
    console.log("VotingActionsHandler: handlePromptSaved called with new prompt");
    onPromptSaved(newPrompt);
  };

  return {
    handleVote,
    handleOriginalAction,
    handleRetry,
    handlePromptSaved,
  };
};
