
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";
import { RealtimeSubscriptionContext } from "./useVotingRealtime.types";

export const subscribeCompletedVotings = (
  context: RealtimeSubscriptionContext
): RealtimeChannel => {
  const {
    asin,
    onVotingCompleted,
    setShowWinningVoteOverlay
  } = context;

  return supabase
    .channel('completed-votings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'completed_votings',
        filter: `asin=eq.${asin}`,
      },
      (payload: any) => {
        console.log("Completion record detected in completed_votings for current ASIN:", payload);
        
        if (payload.new && payload.new.asin === asin) {
          console.log("Completion for current ASIN detected, triggering immediate completion");
          setShowWinningVoteOverlay(true);
          toast.success("Moving to next t-shirt...");
          
          setTimeout(() => {
            setShowWinningVoteOverlay(false);
            if (onVotingCompleted) {
              console.log("Calling onVotingCompleted from completed_votings realtime");
              onVotingCompleted();
            }
          }, 300);
        }
      }
    )
    .subscribe();
};
