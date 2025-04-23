
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
    if (allVoted && onVotingCompleted) {
      const recordCompletion = async () => {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        // Check if this ASIN is already marked as completed
        const { data: existingCompletion } = await supabase
          .from("completed_votings")
          .select("asin")
          .eq("asin", asin)
          .eq("user_id", user.data.user.id)
          .single();
          
        if (existingCompletion) {
          console.log("Completion already recorded for this ASIN, skipping...");
          return;
        }

        // Record the completion
        await supabase
          .from("completed_votings")
          .insert({
            asin: asin,
            user_id: user.data.user.id
          });
      };

      recordCompletion().then(() => {
        onVotingCompleted();
      }).catch(error => {
        console.error("Error recording completion:", error);
        // Still call onVotingCompleted to move to next t-shirt
        onVotingCompleted();
      });
    }
  }, [allVoted, asin, onVotingCompleted]);

  return null;
};

export default VotingCompletionHandler;
