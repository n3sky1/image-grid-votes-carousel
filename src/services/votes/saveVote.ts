
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
    
    // For "love" votes, record completion
    if (voteType === 'love') {
      try {
        // Record the completion for this user
        const { error: completionError } = await supabase
          .from('completed_votings')
          .insert({ 
            asin: conceptData.tshirt_asin,
            user_id: session.user.id
          });
          
        if (completionError) {
          console.error("Error recording completion:", completionError);
        }
      } catch (completionError) {
        console.error("Error recording completion:", completionError);
      }
    }
  } catch (error) {
    console.error("Error in saveUserVote:", error);
    throw error;
  }
};
