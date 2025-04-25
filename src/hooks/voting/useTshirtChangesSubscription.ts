
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
        
        // UPDATED Regeneration detection logic
        if (payload.old && payload.new) {
          // Case 1: Regeneration started - regenerate field changed from false to true
          if (payload.old.regenerate === false && payload.new.regenerate === true) {
            console.log("Regenerate flag changed to TRUE. Showing overlay.");
            setShowRegeneratingOverlay(true);
            setRegenerating(true);
            return;
          }
          
          // Case 2: Regeneration completed - regenerate field changed from true to false
          if (payload.old.regenerate === true && payload.new.regenerate === false) {
            console.log("Regenerate flag changed to FALSE. Regeneration completed. Refreshing images.");
            
            // Log the ready_for_voting state to diagnose if it's being changed
            console.log("T-shirt ready_for_voting (old):", payload.old.ready_for_voting);
            console.log("T-shirt ready_for_voting (new):", payload.new.ready_for_voting);
            
            setRegenerating(false);
            setShowRegeneratingOverlay(false);
            
            // Check auth state before fetching images
            supabase.auth.getSession().then(({ data }) => {
              console.log("Auth session during regeneration completion:", data.session ? "Active" : "None");
              
              if (data.session) {
                fetchImages();
                toast.success("Images regenerated successfully!");
              } else {
                console.warn("No active session found after regeneration completed");
                toast.error("Session expired", { 
                  description: "Please log in again to continue."
                });
              }
            });
            return;
          }
          
          // Case 3: Ready for voting changed - check if this is causing navigation issues
          if (payload.old.ready_for_voting !== payload.new.ready_for_voting) {
            console.log(`Ready for voting changed from ${payload.old.ready_for_voting} to ${payload.new.ready_for_voting}`);
            
            // If changed to false, this might be causing navigation issues
            if (payload.old.ready_for_voting === true && payload.new.ready_for_voting === false) {
              console.log("T-shirt no longer available for voting, moving to next");
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
        }
      }
    )
    .subscribe();
};
