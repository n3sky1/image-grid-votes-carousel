
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";
import { RealtimeSubscriptionContext } from "./useVotingRealtime.types";

export const subscribeConceptChanges = (
  context: RealtimeSubscriptionContext
): RealtimeChannel => {
  const {
    asin,
    onVotingCompleted,
    setShowWinningVoteOverlay
  } = context;

  return supabase
    .channel('concept-votes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'concepts',
        filter: `tshirt_asin=eq.${asin}`,
      },
      (payload: any) => {
        console.log("Concept vote change detected:", payload);
        
        // Check for love vote or multiple likes
        if (
          payload.new && 
          (payload.new.hearts >= 1 || payload.new.votes_up >= 2)
        ) {
          console.log("Winning vote detected! Hearts:", payload.new.hearts, "Likes:", payload.new.votes_up);
          setShowWinningVoteOverlay(true);
          toast.success("Winning design selected!", {
            description: "Moving to next t-shirt..."
          });
          setTimeout(() => {
            setShowWinningVoteOverlay(false);
            if (onVotingCompleted) {
              console.log("Calling onVotingCompleted from realtime due to winning vote");
              onVotingCompleted();
            }
          }, 500);
        }
      }
    )
    .subscribe();
};
