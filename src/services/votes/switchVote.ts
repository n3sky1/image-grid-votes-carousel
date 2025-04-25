
import { supabase } from "@/integrations/supabase/client";
import type { VoteType } from "./types";

export const switchUserVote = async (
  conceptId: string, 
  newVoteType: VoteType,
  oldVoteType: VoteType
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
    
    // First, update the user_votes table with the new vote type
    const { error: voteError } = await supabase
      .from('user_votes')
      .upsert({
        concept_id: conceptId,
        user_id: session.user.id,
        vote_type: newVoteType
      }, {
        onConflict: 'user_id,concept_id'
      });

    if (voteError) {
      console.error("Error switching vote:", voteError);
      throw new Error("Failed to switch vote");
    }

    // Second, decrement the old vote type
    const { error: decrementError } = await supabase.rpc('decrement_concept_vote', {
      p_concept_id: conceptId,
      p_vote_type: oldVoteType
    });

    if (decrementError) {
      throw new Error(`Failed to decrement old vote count: ${decrementError.message}`);
    }

    // Third, increment the new vote type
    const { error: incrementError } = await supabase.rpc('increment_concept_vote', {
      p_concept_id: conceptId,
      p_vote_type: newVoteType
    });

    if (incrementError) {
      throw new Error(`Failed to increment new vote count: ${incrementError.message}`);
    }
    
    // For "love" votes, record completion and set as winning concept
    if (newVoteType === 'love') {
      console.log("Love vote detected for concept:", conceptId);
      
      try {
        // Record the completion for this user
        const { error: completionError } = await supabase
          .from('completed_votings')
          .upsert({ 
            asin: conceptData.tshirt_asin,
            user_id: session.user.id
          });
          
        if (completionError) {
          console.error("Error recording completion:", completionError);
        } else {
          console.log(`Successfully recorded completion for ASIN: ${conceptData.tshirt_asin}`);
        }
        
        // Update the tshirt with the winning concept directly
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
      } catch (completionError) {
        console.error("Error recording completion:", completionError);
      }
    }
  } catch (error) {
    console.error("Error in switchUserVote:", error);
    throw error;
  }
};
