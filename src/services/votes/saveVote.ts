
import { supabase } from "@/integrations/supabase/client";
import type { VoteType } from "./types";

export const saveUserVote = async (
  conceptId: string,
  voteType: VoteType
) => {
  console.log(`[saveUserVote] Starting for conceptId: ${conceptId}, voteType: ${voteType}`);
  
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    console.error("[saveUserVote] Auth error:", authError);
    throw new Error("Authentication required");
  }

  try {
    // Get the concept to find its t-shirt before making any changes
    console.log("[saveUserVote] Fetching concept data to get tshirt_asin");
    const { data: conceptData, error: conceptError } = await supabase
      .from('concepts')
      .select('tshirt_asin')
      .eq('concept_id', conceptId)
      .single();
      
    if (conceptError || !conceptData) {
      console.error("[saveUserVote] Error fetching concept data:", conceptError);
      throw new Error("Failed to fetch concept data");
    }
    
    console.log(`[saveUserVote] Found tshirt_asin: ${conceptData.tshirt_asin} for concept: ${conceptId}`);
    
    // Update user_votes table
    console.log("[saveUserVote] Upserting vote in user_votes table");
    const { error: voteError } = await supabase
      .from('user_votes')
      .upsert({
        concept_id: conceptId,
        user_id: session.user.id,
        vote_type: voteType
      });

    if (voteError) {
      console.error("[saveUserVote] Error saving vote:", voteError);
      throw new Error("Failed to save vote");
    }

    // Call the RPC function to increment the vote
    console.log("[saveUserVote] Calling increment_concept_vote RPC function");
    const { error: incrementError } = await supabase.rpc('increment_concept_vote', {
      p_concept_id: conceptId,
      p_vote_type: voteType
    });

    if (incrementError) {
      console.error("[saveUserVote] Error incrementing vote count:", incrementError);
      throw new Error(`Failed to update vote count: ${incrementError.message}`);
    }
    
    // For "love" votes, record completion immediately to ensure transition
    if (voteType === 'love') {
      try {
        console.log(`[saveUserVote] Love vote detected for concept: ${conceptId}, ensuring completion recording`);
        
        // Record the completion for this user first to ensure it's always recorded
        console.log(`[saveUserVote] Recording completion for ASIN: ${conceptData.tshirt_asin}`);
        const { error: completionError } = await supabase
          .from('completed_votings')
          .upsert({ 
            asin: conceptData.tshirt_asin,
            user_id: session.user.id
          });
          
        if (completionError) {
          console.error("[saveUserVote] Error recording completion:", completionError);
        } else {
          console.log(`[saveUserVote] Successfully recorded completion for ASIN: ${conceptData.tshirt_asin}`);
        }
        
        try {
          // Try to update the tshirt with the winning concept - this may fail due to permissions
          // but that's expected and the completion record above will handle the transition
          console.log(`[saveUserVote] Attempting to set winning concept ${conceptId} for ASIN: ${conceptData.tshirt_asin}`);
          const { error: winningConceptError } = await supabase
            .from('tshirts')
            .update({
              winning_concept_id: conceptId,
              ready_for_voting: false
            })
            .eq('asin', conceptData.tshirt_asin)
            .is('winning_concept_id', null); // Only update if there's no winner yet
            
          if (winningConceptError) {
            console.log("[saveUserVote] Note: Error setting winning concept (expected with current RLS):", winningConceptError);
            // This error is expected due to RLS permissions - the trigger functions will handle this
          } else {
            console.log(`[saveUserVote] Successfully set winning concept ${conceptId} for ASIN: ${conceptData.tshirt_asin}`);
          }
        } catch (updateError) {
          console.error("[saveUserVote] Error setting winning concept:", updateError);
          // Non-critical error, continue execution
        }
      } catch (completionError) {
        console.error("[saveUserVote] Error in love vote special handling:", completionError);
        // Non-critical error, continue execution 
      }
    }
    
    console.log(`[saveUserVote] Successfully completed for conceptId: ${conceptId}, voteType: ${voteType}`);
    return true;
  } catch (error) {
    console.error("[saveUserVote] Error in saveUserVote:", error);
    throw error;
  }
};
