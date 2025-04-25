
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
            }, 2000);
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
            }, 2000);
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
          
          // Check for both regular votes and heart votes
          if (payload.new) {
            const hasWinningVotes = payload.new.votes_up >= 2;
            const hasWinningHearts = payload.new.hearts >= 1;
            
            if (hasWinningVotes || hasWinningHearts) {
              console.log(`Potential winner detected! Hearts: ${payload.new.hearts}, Votes: ${payload.new.votes_up}`);
              // This will trigger a refresh that will pick up the winning state
              // since the database trigger should have updated the tshirt's winning_concept_id
              fetchImages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Removing realtime listeners for ASIN: ${asin}`);
      supabase.removeChannel(tshirtChangesChannel);
      supabase.removeChannel(conceptChangesChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, fetchImages, setRegenerating]);
  
  return { showWinningVoteOverlay };
};
