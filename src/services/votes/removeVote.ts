
import { supabase } from "@/integrations/supabase/client";

export const removeUserVote = async (conceptId: string) => {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    console.error("Auth error:", authError);
    throw new Error("Authentication required");
  }

  try {
    // Remove the user's vote from user_votes table
    const { error: voteError } = await supabase
      .from('user_votes')
      .delete()
      .eq('concept_id', conceptId)
      .eq('user_id', session.user.id);

    if (voteError) {
      console.error("Error removing vote:", voteError);
      throw new Error("Failed to remove vote");
    }

    // Call the API endpoint to decrement the concept vote
    const { error: decrementError } = await supabase.rpc('decrement_concept_vote', {
      p_concept_id: conceptId
    });

    if (decrementError) {
      throw new Error(`Failed to update vote count: ${decrementError.message}`);
    }
  } catch (error) {
    console.error("Error in removeUserVote:", error);
    throw error;
  }
};
