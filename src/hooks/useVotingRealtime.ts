
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UseVotingRealtimeProps, RealtimeHandlers } from './voting/useVotingRealtime.types';
import { subscribeTshirtChanges } from './voting/useTshirtChangesSubscription';
import { subscribeConceptChanges } from './voting/useConceptChangesSubscription';
import { subscribeUserVotes } from './voting/useUserVotesSubscription';
import { subscribeCompletedVotings } from './voting/useCompletedVotingsSubscription';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

export const useVotingRealtime = ({
  asin,
  onVotingCompleted,
  setShowRegeneratingOverlay,
  setRegenerating,
  fetchImages
}: UseVotingRealtimeProps): RealtimeHandlers => {
  const [showWinningVoteOverlay, setShowWinningVoteOverlay] = useState(false);
  const { refreshSession } = useAuth();
  
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
      fetchImages: async () => {
        try {
          await refreshSession();
          await fetchImages();
        } catch (err) {
          console.error("Error refreshing session and fetching images:", err);
        }
      },
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
          .select('regenerate, ready_for_voting, winning_concept_id')
          .eq('asin', asin)
          .single();
        
        if (error) {
          console.error("Error checking initial regeneration status:", error);
          return;
        }
        
        if (data) {
          console.log("Initial status check - Regenerate:", data.regenerate, 
                     "Ready for voting:", data.ready_for_voting,
                     "Winning concept:", data.winning_concept_id);
          
          // Show overlay if regenerate is true
          if (data.regenerate === true) {
            console.log("T-shirt is currently regenerating on component mount, showing overlay");
            setShowRegeneratingOverlay(true);
            setRegenerating(true);
            
            // Since regeneration is already in progress, we'll poll until it's complete
            const pollInterval = setInterval(async () => {
              const { data: updated, error: pollError } = await supabase
                .from('tshirts')
                .select('regenerate')
                .eq('asin', asin)
                .single();
                
              if (pollError) {
                console.error("Error polling regeneration status:", pollError);
                return;
              }
                
              if (updated && updated.regenerate === false) {
                console.log("Regeneration completed during polling, refreshing data");
                clearInterval(pollInterval);
                setShowRegeneratingOverlay(false);
                setRegenerating(false);
                
                try {
                  await refreshSession();
                  await fetchImages();
                  toast.success("Images regenerated successfully!");
                } catch (err) {
                  console.error("Error refreshing images after polling:", err);
                }
              }
            }, 5000); // Check every 5 seconds
            
            // Safety cleanup - stop polling after 90 seconds max
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 90000);
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
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, setRegenerating, fetchImages, refreshSession]);
  
  return { showWinningVoteOverlay };
};
