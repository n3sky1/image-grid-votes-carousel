
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
      async (payload: any) => {
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
        
        // Regeneration detection logic
        if (payload.old && payload.new) {
          // Log regenerate values for debugging
          console.log("Regenerate values - Old:", payload.old.regenerate, "New:", payload.new.regenerate);
          console.log("Ready for voting values - Old:", payload.old.ready_for_voting, "New:", payload.new.ready_for_voting);
          
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
            
            // Update state to hide overlay immediately
            setRegenerating(false);
            setShowRegeneratingOverlay(false);
            toast.success("Regeneration completed!");
            
            try {
              // Get the current session
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) {
                console.error("Session error during regeneration completion:", sessionError);
                return;
              }
              
              console.log("Session during regeneration completion:", sessionData.session ? "Active" : "None");
              
              if (sessionData.session) {
                console.log("Valid session found, refreshing token and fetching images");
                
                try {
                  // Refresh the token to ensure it's valid
                  await supabase.auth.refreshSession();
                  
                  // Fetch the updated images
                  console.log("Refreshing images after regeneration");
                  await fetchImages();
                } catch (refreshError) {
                  console.error("Error refreshing token or fetching images:", refreshError);
                }
              } else {
                console.warn("No active session found after regeneration");
                toast.error("Session expired", { 
                  description: "Please log in again to continue."
                });
              }
            } catch (err) {
              console.error("Error handling regeneration completion:", err);
            }
            return;
          }
          
          // Case 3: Ready for voting changed
          if (payload.old.ready_for_voting !== payload.new.ready_for_voting) {
            console.log(`Ready for voting changed from ${payload.old.ready_for_voting} to ${payload.new.ready_for_voting}`);
            
            // Only navigate if changed from true to false and not during regeneration
            if (payload.old.ready_for_voting === true && payload.new.ready_for_voting === false && !payload.new.regenerate) {
              console.log("T-shirt no longer available for voting, moving to next");
              
              // Check session before navigating
              const { data } = await supabase.auth.getSession();
              
              if (data.session) {
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
      }
    )
    .subscribe();
};
