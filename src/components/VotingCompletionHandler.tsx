
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VotingCompletionHandlerProps {
  allVoted: boolean;
  asin: string;
  onVotingCompleted?: () => void;
}

const VotingCompletionHandler = ({
  allVoted,
  asin,
  onVotingCompleted
}: VotingCompletionHandlerProps) => {
  useEffect(() => {
    if (!allVoted || !onVotingCompleted || !asin) {
      return;
    }

    const recordCompletion = async () => {
      try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        // Check if this ASIN is already marked as completed
        const { data: existingCompletion, error: checkError } = await supabase
          .from("completed_votings")
          .select("asin")
          .eq("asin", asin)
          .eq("user_id", user.data.user.id)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is the "no rows returned" error, which is expected
          // Only report other types of errors
          console.error("Error checking completion:", checkError);
        }
        
        // If already completed, don't record again
        if (existingCompletion) {
          console.log("Completion already recorded for this ASIN, skipping...");
          onVotingCompleted();
          return;
        }

        // Record the completion
        const { error: insertError } = await supabase
          .from("completed_votings")
          .insert({
            asin: asin,
            user_id: user.data.user.id
          });

        if (insertError) {
          console.error("Error recording completion:", insertError);
        }
        
        // Call onVotingCompleted to move to next t-shirt
        onVotingCompleted();
      } catch (error) {
        console.error("Unexpected error in VotingCompletionHandler:", error);
        // Still call onVotingCompleted to move to next t-shirt
        onVotingCompleted();
      }
    };

    recordCompletion();
  }, [allVoted, asin, onVotingCompleted]);

  return null;
};

export default VotingCompletionHandler;
