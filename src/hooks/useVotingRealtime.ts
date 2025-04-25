
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
  
  useEffect(() => {
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

    return () => {
      console.log(`Removing realtime listeners for ASIN: ${asin}`);
      supabase.removeChannel(tshirtChannel);
      supabase.removeChannel(conceptChannel);
      supabase.removeChannel(userVotesChannel);
      supabase.removeChannel(completedVotingsChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, fetchImages, setRegenerating]);
  
  return { showWinningVoteOverlay };
};
