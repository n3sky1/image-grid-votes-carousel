
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";
import { RealtimeSubscriptionContext } from "./useVotingRealtime.types";

export const subscribeTshirtChanges = (
  context: RealtimeSubscriptionContext
): RealtimeChannel => {
  const {
    asin,
    onVotingCompleted,
    setShowRegeneratingOverlay,
    setRegenerating,
    fetchImages,
    setShowWinningVoteOverlay
  } = context;

  return supabase
    .channel('tshirt-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tshirts',
        filter: `asin=eq.${asin}`,
      },
      (payload: any) => {
        console.log("Tshirt change detected:", payload);
        
        // Check if a winning concept was selected
        if (
          payload.old && 
          payload.new && 
          payload.old.winning_concept_id === null && 
          payload.new.winning_concept_id !== null
        ) {
          console.log("Winner detected! Showing overlay and triggering transition");
          setShowWinningVoteOverlay(true);
          toast.success("Winning design selected!", {
            description: "Moving to next t-shirt..."
          });
          setTimeout(() => {
            setShowWinningVoteOverlay(false);
            if (onVotingCompleted) {
              console.log("Calling onVotingCompleted from realtime due to winning concept");
              onVotingCompleted();
            }
          }, 500);
          return;
        }
        
        // Handle regeneration start
        if (
          payload.old && 
          payload.new && 
          (
            (!payload.old.regenerate && payload.new.regenerate) ||
            (payload.old.ai_processing_status !== 'regenerating' && payload.new.ai_processing_status === 'regenerating') ||
            (payload.old.ai_processing_status !== 'regeneration_requested' && payload.new.ai_processing_status === 'regeneration_requested')
          )
        ) {
          console.log("Regeneration detected. Showing overlay and setting regenerating state");
          setShowRegeneratingOverlay(true);
          setRegenerating(true);
        }
        
        // Handle regeneration completion
        if (
          payload.old && 
          payload.new && 
          payload.old.ai_processing_status === 'regenerating' && 
          payload.new.ai_processing_status === 'regeneration_complete'
        ) {
          console.log("Regeneration complete detected. Refreshing images");
          setRegenerating(false);
          fetchImages();
        }

        // Handle t-shirt becoming unavailable for voting
        if (
          payload.old && 
          payload.new && 
          payload.old.ready_for_voting === true &&
          payload.new.ready_for_voting === false 
        ) {
          console.log("Tshirt no longer available for voting, moving to next");
          setShowWinningVoteOverlay(true);
          toast.success("Moving to next t-shirt...");
          setTimeout(() => {
            setShowWinningVoteOverlay(false);
            if (onVotingCompleted) {
              console.log("Calling onVotingCompleted from realtime due to t-shirt no longer available");
              onVotingCompleted();
            }
          }, 500);
        }
      }
    )
    .subscribe();
};
