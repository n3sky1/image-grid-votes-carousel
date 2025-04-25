
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
        console.log(`[saveUserVote] Love vote detected for concept: ${conceptId}, recording completion`);
        
        // Record the completion for this user to ensure it's always recorded
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
        
        // We'll no longer try to update the tshirt table directly from the client
        // since this operation fails due to permission issues.
        // Instead, we'll rely on the realtime subscription to detect concept votes
        // and transition accordingly.
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
