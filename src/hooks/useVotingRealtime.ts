
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UseVotingRealtimeProps, RealtimeHandlers } from './voting/useVotingRealtime.types';
import { subscribeTshirtChanges } from './voting/useTshirtChangesSubscription';
import { subscribeConceptChanges } from './voting/useConceptChangesSubscription';
import { subscribeUserVotes } from './voting/useUserVotesSubscription';
import { subscribeCompletedVotings } from './voting/useCompletedVotingsSubscription';

export const useVotingRealtime = ({
  asin,
  onVotingCompleted,
  setShowRegeneratingOverlay,
  setRegenerating,
  fetchImages
}: UseVotingRealtimeProps): RealtimeHandlers => {
  const [showWinningVoteOverlay, setShowWinningVoteOverlay] = useState(false);
  
  // Reset state when ASIN changes
  useEffect(() => {
    setShowWinningVoteOverlay(false);
    // Here we're not resetting setShowRegeneratingOverlay or setRegenerating
    // as those are passed in from parent and should be managed there
  }, [asin]);

  useEffect(() => {
    if (!asin) return;
    
    console.log(`Setting up realtime listeners for ASIN: ${asin}`);
    
    const context = {
      asin,
      onVotingCompleted,
      setShowRegeneratingOverlay,
      setRegenerating,
      fetchImages,
      setShowWinningVoteOverlay
    };

    // Subscribe to all relevant channels
    const tshirtChannel = subscribeTshirtChanges(context);
    const conceptChannel = subscribeConceptChanges(context);
    const userVotesChannel = subscribeUserVotes(context);
    const completedVotingsChannel = subscribeCompletedVotings(context);

    // Check if the t-shirt is already regenerating when component mounts
    const checkInitialStatus = async () => {
      try {
        console.log("Checking initial regeneration status for ASIN:", asin);
        const { data, error } = await supabase
          .from('tshirts')
          .select('regenerate')
          .eq('asin', asin)
          .single();
        
        if (error) {
          console.error("Error checking initial regeneration status:", error);
          return;
        }
        
        if (data) {
          console.log("Initial regenerate value:", data.regenerate);
          // Only check the regenerate flag, not the processing status
          if (data.regenerate === true) {
            console.log("T-shirt is currently regenerating on component mount, showing overlay");
            setShowRegeneratingOverlay(true);
            setRegenerating(true);
          } else {
            console.log("T-shirt is not regenerating on component mount");
            setShowRegeneratingOverlay(false);
            setRegenerating(false);
          }
        }
      } catch (err) {
        console.error("Error checking initial regeneration status:", err);
      }
    };
    
    checkInitialStatus();

    return () => {
      console.log(`Removing realtime listeners for ASIN: ${asin}`);
      supabase.removeChannel(tshirtChannel);
      supabase.removeChannel(conceptChannel);
      supabase.removeChannel(userVotesChannel);
      supabase.removeChannel(completedVotingsChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, setRegenerating, fetchImages]);
  
  return { showWinningVoteOverlay };
};
