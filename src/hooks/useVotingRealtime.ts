
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

    // Check if the t-shirt is already in regenerating state when component mounts
    const checkInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('tshirts')
          .select('regenerate, ai_processing_status')
          .eq('asin', asin)
          .single();
        
        if (!error && data) {
          if (data.regenerate === true || ['regeneration_requested', 'regenerating'].includes(data.ai_processing_status)) {
            console.log("T-shirt already regenerating on component mount, showing overlay");
            setShowRegeneratingOverlay(true);
            setRegenerating(true);
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
