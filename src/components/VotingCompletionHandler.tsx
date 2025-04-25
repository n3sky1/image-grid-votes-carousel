
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./ui/sonner";

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
  const [completionRecorded, setCompletionRecorded] = useState(false);

  useEffect(() => {
    // Only process when all concepts are actually voted on and we haven't already processed this completion
    if (!allVoted || !onVotingCompleted || !asin || isProcessing || completionRecorded) {
      return;
    }

    console.log(`VotingCompletionHandler: All voted for ${asin}, recording completion`);
    
    const recordCompletion = async () => {
      try {
        setIsProcessing(true);
        
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          console.error("VotingCompletionHandler: No user found, cannot record completion");
          setIsProcessing(false);
          return;
        }

        // Check if the tshirt has a winning concept already
        console.log(`VotingCompletionHandler: Checking if tshirt ${asin} has a winning concept`);
        const { data: tshirtData, error: tshirtError } = await supabase
          .from("tshirts")
          .select("winning_concept_id")
          .eq("asin", asin)
          .maybeSingle();
          
        if (tshirtError) {
          console.error("VotingCompletionHandler: Error checking tshirt winner:", tshirtError);
        } else if (tshirtData?.winning_concept_id) {
          console.log("VotingCompletionHandler: Tshirt already has a winning concept:", tshirtData.winning_concept_id);
          setCompletionRecorded(true);
          onVotingCompleted();
          setIsProcessing(false);
          return;
        }

        // Check if this ASIN is already marked as completed
        console.log(`VotingCompletionHandler: Checking if ASIN ${asin} is already completed`);
        const { data: existingCompletion, error: checkError } = await supabase
          .from("completed_votings")
          .select("asin")
          .eq("asin", asin)
          .eq("user_id", user.data.user.id)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is the "no rows returned" error, which is expected
          // Only report other types of errors
          console.error("VotingCompletionHandler: Error checking completion:", checkError);
        }
        
        // If already completed, don't record again
        if (existingCompletion) {
          console.log("VotingCompletionHandler: Completion already recorded for this ASIN, moving to next...");
          setCompletionRecorded(true);
          onVotingCompleted();
          setIsProcessing(false);
          return;
        }

        // Record the completion - now with proper permissions this should work
        console.log("VotingCompletionHandler: Recording completion in database...");
        const { error: insertError } = await supabase
          .from("completed_votings")
          .upsert({
            asin: asin,
            user_id: user.data.user.id
          });

        if (insertError) {
          console.error("VotingCompletionHandler: Error recording completion:", insertError);
          console.log("VotingCompletionHandler: Error details:", JSON.stringify(insertError));
        } else {
          console.log(`VotingCompletionHandler: Successfully recorded completion for ASIN: ${asin}`);
        }
        
        // Mark as completed and call the callback even if there was an error
        console.log(`VotingCompletionHandler: Marking as completed and calling onVotingCompleted for ASIN: ${asin}`);
        setCompletionRecorded(true);
        onVotingCompleted();
      } catch (error) {
        console.error("VotingCompletionHandler: Unexpected error:", error);
        // Still call onVotingCompleted to move to next t-shirt even if there's an error
        console.log("VotingCompletionHandler: Calling onVotingCompleted despite error");
        setCompletionRecorded(true);
        onVotingCompleted();
      } finally {
        setIsProcessing(false);
      }
    };

    recordCompletion();
  }, [allVoted, asin, onVotingCompleted, isProcessing, completionRecorded]);

  return null;
};

export default VotingCompletionHandler;
