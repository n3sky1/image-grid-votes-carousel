
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
        
        // Enhanced regeneration detection
        if (payload.new) {
          // Case 1: Regenerate flag changes from false to true
          if (payload.old?.regenerate === false && payload.new.regenerate === true) {
            console.log("Regenerate flag changed to true. Showing overlay.");
            setShowRegeneratingOverlay(true);
            setRegenerating(true);
            return;
          }
          
          // Case 2: AI processing status changed to regeneration related values
          if (payload.old?.ai_processing_status !== payload.new.ai_processing_status) {
            if (['regeneration_requested', 'regenerating'].includes(payload.new.ai_processing_status)) {
              console.log(`AI processing status changed to ${payload.new.ai_processing_status}. Showing overlay.`);
              setShowRegeneratingOverlay(true);
              setRegenerating(true);
              return;
            }
            
            // Case 3: Regeneration completed
            if (payload.old?.ai_processing_status === 'regenerating' && 
                payload.new.ai_processing_status === 'regeneration_complete') {
              console.log("Regeneration complete. Refreshing images and hiding overlay.");
              setRegenerating(false);
              setShowRegeneratingOverlay(false);
              fetchImages();
              toast.success("Images regenerated successfully!");
              return;
            }
          }
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
