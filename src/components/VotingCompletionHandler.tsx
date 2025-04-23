
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VotingCompletionHandlerProps {
  asin: string;
  onVotingCompleted?: () => void;
}

const VotingCompletionHandler = ({
  asin,
  onVotingCompleted
}: VotingCompletionHandlerProps) => {
  useEffect(() => {
    // We no longer check for allVoted, this component just records completed votings
    // when explicitly instructed to do so via props or other mechanisms
    
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

    if (onVotingCompleted) {
      recordCompletion().then(() => {
        onVotingCompleted();
      });
    }
  }, [asin, onVotingCompleted]);

  return null;
};

export default VotingCompletionHandler;
