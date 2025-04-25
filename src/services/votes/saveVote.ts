
import { supabase } from "@/integrations/supabase/client";
import type { VoteType } from "./types";

export const saveUserVote = async (
  conceptId: string,
  voteType: VoteType
) => {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    console.error("Auth error:", authError);
    throw new Error("Authentication required");
  }

  try {
    // Get the concept to find its t-shirt before making any changes
    const { data: conceptData, error: conceptError } = await supabase
      .from('concepts')
      .select('tshirt_asin')
      .eq('concept_id', conceptId)
      .single();
      
    if (conceptError || !conceptData) {
      console.error("Error fetching concept data:", conceptError);
      throw new Error("Failed to fetch concept data");
    }
    
    // Update user_votes table
    const { error: voteError } = await supabase
      .from('user_votes')
      .upsert({
        concept_id: conceptId,
        user_id: session.user.id,
        vote_type: voteType
      });

    if (voteError) {
      console.error("Error saving vote:", voteError);
      throw new Error("Failed to save vote");
    }

    // Call the RPC function to increment the vote
    const { error: incrementError } = await supabase.rpc('increment_concept_vote', {
      p_concept_id: conceptId,
      p_vote_type: voteType
    });

    if (incrementError) {
      throw new Error(`Failed to update vote count: ${incrementError.message}`);
    }
    
    // For "love" votes, record completion and update the tshirt winning_concept_id directly
    if (voteType === 'love') {
      try {
        console.log("Love vote detected for concept:", conceptId);
        
        // Record the completion for this user first to ensure it's always recorded
        const { error: completionError } = await supabase
          .from('completed_votings')
          .upsert({ 
            asin: conceptData.tshirt_asin,
            user_id: session.user.id
          });
          
        if (completionError) {
          console.error("Error recording completion:", completionError);
          // Continue even if there's an error - we'll still try to update the tshirt
        } else {
          console.log(`Successfully recorded completion for ASIN: ${conceptData.tshirt_asin}`);
        }
        
        // Try to update the tshirt with the winning concept
        try {
          const { error: winningConceptError } = await supabase
            .from('tshirts')
            .update({
              winning_concept_id: conceptId,
              ready_for_voting: false
            })
            .eq('asin', conceptData.tshirt_asin)
            .is('winning_concept_id', null); // Only update if there's no winner yet
            
          if (winningConceptError) {
            console.error("Error setting winning concept:", winningConceptError);
          } else {
            console.log(`Successfully set winning concept ${conceptId} for ASIN: ${conceptData.tshirt_asin}`);
          }
        } catch (updateError) {
          console.error("Error setting winning concept:", updateError);
        }
      } catch (completionError) {
        console.error("Error recording completion:", completionError);
        // We'll still succeed even if we couldn't update the tshirt
      }
    }
  } catch (error) {
    console.error("Error in saveUserVote:", error);
    throw error;
  }
};
