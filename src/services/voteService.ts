import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export const saveUserVote = async (
  conceptId: string,
  voteType: 'like' | 'dislike' | 'love'
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
      }, {
        onConflict: 'user_id,concept_id'
      });

    if (voteError) {
      console.error("Error saving vote:", voteError);
      throw new Error("Failed to save vote");
    }

    // Call the API endpoint to increment the vote
    const response = await fetch(`https://hdfxqwkuirbizwqrvtsd.supabase.co/functions/v1/increment_concept_vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        p_concept_id: conceptId,
        p_vote_type: voteType
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update vote count: ${response.statusText}`);
    }
    
    // For "love" votes, immediately record completion and trigger the completion event
    // Note: We're no longer trying to update the tshirt table directly from the client
    // Instead, we'll rely on the database trigger to handle setting the winning concept
    if (voteType === 'love') {
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
      } catch (completionError) {
        console.error("Error recording completion:", completionError);
      }
    } 
  } catch (error) {
    console.error("Error in saveUserVote:", error);
    throw error;
  }
};

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

    // Call the API endpoint
    const response = await fetch(`https://hdfxqwkuirbizwqrvtsd.supabase.co/functions/v1/decrement_concept_vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        p_concept_id: conceptId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update vote count: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error in removeUserVote:", error);
    throw error;
  }
};

export const switchUserVote = async (
  conceptId: string, 
  newVoteType: 'like' | 'dislike' | 'love',
  oldVoteType: 'like' | 'dislike' | 'love'
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

    // Second, call the decrement function for the old vote type
    const decrementResponse = await fetch(`https://hdfxqwkuirbizwqrvtsd.supabase.co/functions/v1/decrement_concept_vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        p_concept_id: conceptId,
        p_vote_type: oldVoteType
      })
    });

    if (!decrementResponse.ok) {
      throw new Error(`Failed to decrement old vote count: ${decrementResponse.statusText}`);
    }

    // Third, call the increment function for the new vote type
    const incrementResponse = await fetch(`https://hdfxqwkuirbizwqrvtsd.supabase.co/functions/v1/increment_concept_vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        p_concept_id: conceptId,
        p_vote_type: newVoteType
      })
    });

    if (!incrementResponse.ok) {
      throw new Error(`Failed to increment new vote count: ${incrementResponse.statusText}`);
    }
    
    // For "love" votes, record completion
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
      } catch (completionError) {
        console.error("Error recording completion:", completionError);
      }
    }
  } catch (error) {
    console.error("Error in switchUserVote:", error);
    throw error;
  }
};
