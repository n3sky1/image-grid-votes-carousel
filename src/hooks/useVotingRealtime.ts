
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

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
  useEffect(() => {
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
          
          if (
            payload.old && 
            payload.new && 
            payload.old.winning_concept_id === null && 
            payload.new.winning_concept_id !== null
          ) {
            console.log("Winner detected! Showing overlay");
            setShowRegeneratingOverlay(true);
            setTimeout(() => {
              if (onVotingCompleted) {
                onVotingCompleted();
              }
            }, 2000);
          }
          
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
              console.log("Potential winner based on votes/hearts. Refreshing data");
              // This will trigger a refresh that will pick up the winning state
              // since the database trigger will have updated the tshirt's winning_concept_id
              fetchImages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tshirtChangesChannel);
      supabase.removeChannel(conceptChangesChannel);
    };
  }, [asin, onVotingCompleted, setShowRegeneratingOverlay, fetchImages, setRegenerating]);
};
