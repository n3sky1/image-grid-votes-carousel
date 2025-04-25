
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface UseVotingRealtimeProps {
  asin: string;
  onVotingCompleted?: () => void;
  setShowRegeneratingOverlay: (show: boolean) => void;
  setRegenerating: (regenerating: boolean) => void;
  fetchImages: () => void;
}

export const useVotingRealtime = ({
  asin,
  onVotingCompleted,
  setShowRegeneratingOverlay,
  setRegenerating,
  fetchImages
}: UseVotingRealtimeProps) => {
  const [showWinningVoteOverlay, setShowWinningVoteOverlay] = useState(false);
  
  useEffect(() => {
    console.log(`Setting up realtime listeners for ASIN: ${asin}`);
    
    const tshirtChangesChannel = supabase
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
            console.log("Winner detected! Showing overlay");
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
            }, 1000); // Reduced from 1500ms to 1000ms for faster transition
            return; // Exit early as we're moving to next t-shirt
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
            payload.new.ready_for_voting === false &&
            payload.new.winning_concept_id
          ) {
            console.log("Tshirt no longer available for voting because it has a winner");
            setShowWinningVoteOverlay(true);
            toast.success("Winning design selected!", {
              description: "Moving to next t-shirt..."
            });
            setTimeout(() => {
              setShowWinningVoteOverlay(false);
              if (onVotingCompleted) {
                console.log("Calling onVotingCompleted from realtime due to t-shirt no longer available");
                onVotingCompleted();
              }
            }, 800); // Reduced timeout for even faster transition
          }
        }
      )
      .subscribe();
      
    const conceptChangesChannel = supabase
      .channel('concept-votes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'concepts',
          filter: `tshirt_asin=eq.${asin}`,
        },
        (payload: any) => {
          console.log("Concept vote change detected:", payload);
          
          // Check for love vote (hearts >= 1)
          if (payload.new && payload.new.hearts >= 1) {
            console.log("Love vote detected! Concept has hearts:", payload.new.hearts);
            // This will trigger the winning vote overlay and navigate to next t-shirt
            setShowWinningVoteOverlay(true);
            toast.success("Winning design selected!", {
              description: "Moving to next t-shirt..."
            });
            setTimeout(() => {
              setShowWinningVoteOverlay(false);
              if (onVotingCompleted) {
                console.log("Calling onVotingCompleted from realtime due to love vote");
                onVotingCompleted();
              }
            }, 800); // Reduced timeout for faster transition
          }
          
          // Check for multiple likes (votes_up >= 2)
          if (payload.new && payload.new.votes_up >= 2) {
            console.log("Winning votes detected! Concept has likes:", payload.new.votes_up);
            setShowWinningVoteOverlay(true);
            toast.success("Winning design selected!", {
              description: "Moving to next t-shirt..."
            });
            setTimeout(() => {
              setShowWinningVoteOverlay(false);
              if (onVotingCompleted) {
                console.log("Calling onVotingCompleted from realtime due to 2+ likes");
                onVotingCompleted();
              }
            }, 800); // Reduced timeout for faster transition
          }
        }
      )
      .subscribe();

    // Listen for love votes in user_votes table to trigger immediate completion
    const userVotesChannel = supabase
      .channel('user-votes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_votes',
          filter: `vote_type=eq.love`,
        },
        async (payload: any) => {
          console.log("Love vote detected in user_votes:", payload);
          
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
                console.log("Love vote for current ASIN detected, triggering completion");
                setShowWinningVoteOverlay(true);
                toast.success("Winning design selected!", {
                  description: "Moving to next t-shirt..."
                });
                
                // Don't worry about updating the tshirt table as that will happen via RPC or backend
                
                // Call the completion callback with minimal delay
                setTimeout(() => {
                  setShowWinningVoteOverlay(false);
                  if (onVotingCompleted) {
                    console.log("Calling onVotingCompleted from user_votes realtime");
                    onVotingCompleted();
                  }
                }, 500); // Even shorter timeout for faster transition
              }
            } catch (error) {
              console.error("Error handling love vote in realtime:", error);
              
              // Even if there's an error, try to move to the next t-shirt
              if (onVotingCompleted) {
                console.log("Error when handling love vote, calling onVotingCompleted anyway");
                setTimeout(() => onVotingCompleted(), 500);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Removing realtime listeners for ASIN: ${asin}`);
      supabase.removeChannel(tshirtChangesChannel);
      supabase.removeChannel(conceptChangesChannel);
      supabase.removeChannel(userVotesChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, fetchImages, setRegenerating]);
  
  return { showWinningVoteOverlay };
};
