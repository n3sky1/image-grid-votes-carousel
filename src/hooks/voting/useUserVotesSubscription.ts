
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";
import { RealtimeSubscriptionContext } from "./useVotingRealtime.types";

export const subscribeUserVotes = (
  context: RealtimeSubscriptionContext
): RealtimeChannel => {
  const {
    asin,
    onVotingCompleted,
    setShowWinningVoteOverlay
  } = context;

  return supabase
    .channel('user-votes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_votes',
        filter: `vote_type=eq.love`,
      },
      async (payload: any) => {
        console.log("Love vote detected in user_votes table:", payload);
        
        if (payload.new && payload.new.concept_id) {
          try {
            // Check if this concept belongs to our current ASIN
            const { data, error } = await supabase
              .from('concepts')
              .select('tshirt_asin')
              .eq('concept_id', payload.new.concept_id)
              .single();
              
            if (error) {
              console.error("Error checking concept ASIN:", error);
              return;
            }
              
            if (data && data.tshirt_asin === asin) {
              console.log("Love vote for current ASIN detected, triggering immediate completion");
              setShowWinningVoteOverlay(true);
              toast.success("Winning design selected!", {
                description: "Moving to next t-shirt..."
              });
              
              setTimeout(() => {
                setShowWinningVoteOverlay(false);
                if (onVotingCompleted) {
                  console.log("Calling onVotingCompleted from user_votes realtime");
                  onVotingCompleted();
                }
              }, 300);
            }
          } catch (error) {
            console.error("Error handling love vote in realtime:", error);
            
            // Even if there's an error, try to move to the next t-shirt
            if (onVotingCompleted) {
              console.log("Error when handling love vote, calling onVotingCompleted anyway");
              setTimeout(() => onVotingCompleted(), 300);
            }
          }
        }
      }
    )
    .subscribe();
};
