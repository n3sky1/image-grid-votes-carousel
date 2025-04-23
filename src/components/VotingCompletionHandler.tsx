
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

  return null;
};

export default VotingCompletionHandler;
