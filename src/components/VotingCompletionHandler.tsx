
import { useEffect, useState } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!allVoted || !onVotingCompleted || !asin || isProcessing) {
      return;
    }

    const recordCompletion = async () => {
      try {
        setIsProcessing(true);
        
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          console.log("No user found, cannot record completion");
          setIsProcessing(false);
          return;
        }

        // Check if the tshirt has a winning concept already
        const { data: tshirtData, error: tshirtError } = await supabase
          .from("tshirts")
          .select("winning_concept_id")
          .eq("asin", asin)
          .maybeSingle();
          
        if (tshirtError) {
          console.error("Error checking tshirt winner:", tshirtError);
        } else if (tshirtData?.winning_concept_id) {
          console.log("Tshirt already has a winning concept:", tshirtData.winning_concept_id);
          onVotingCompleted();
          setIsProcessing(false);
          return;
        }

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
          setIsProcessing(false);
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
        } else {
          console.log(`Successfully recorded completion for ASIN: ${asin}`);
        }
        
        // Call onVotingCompleted to move to next t-shirt
        onVotingCompleted();
      } catch (error) {
        console.error("Unexpected error in VotingCompletionHandler:", error);
        // Still call onVotingCompleted to move to next t-shirt
        onVotingCompleted();
      } finally {
        setIsProcessing(false);
      }
    };

    recordCompletion();
  }, [allVoted, asin, onVotingCompleted, isProcessing]);

  return null;
};

export default VotingCompletionHandler;
