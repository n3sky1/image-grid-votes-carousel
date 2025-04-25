
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
    
    // For "love" votes, record completion FIRST to ensure transition happens even if other parts fail
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
          
          // Use history.pushState to avoid a full page reload while changing the URL
          // This preserves the session state better than window.location methods
          window.history.pushState({}, '', '/');
          
          // Dispatch a custom event to notify the app to load the next t-shirt
          // Include more detail in the event to help with stats refreshing
          window.dispatchEvent(new CustomEvent('voteCompleted', { 
            detail: { 
              asin: conceptData.tshirt_asin,
              voteType: voteType,
              conceptId: conceptId
            } 
          }));
          
          // Return early to prevent additional processing
          return true;
        }
      } catch (completionError) {
        console.error("[saveUserVote] Error in love vote special handling:", completionError);
        // Non-critical error, continue execution
      }
    }
    
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
      // Don't throw here, we want to continue with increment
    }

    // Call the RPC function to increment the vote
    console.log("[saveUserVote] Calling increment_concept_vote RPC function");
    const { error: incrementError } = await supabase.rpc('increment_concept_vote', {
      p_concept_id: conceptId,
      p_vote_type: voteType
    });

    if (incrementError) {
      console.error("[saveUserVote] Error incrementing vote count:", incrementError);
      // Don't throw here, we want to continue processing
    }
    
    console.log(`[saveUserVote] Successfully completed for conceptId: ${conceptId}, voteType: ${voteType}`);
    return true;
  } catch (error) {
    console.error("[saveUserVote] Error in saveUserVote:", error);
    // Rethrow for handling at the UI level
    throw error;
  }
};
