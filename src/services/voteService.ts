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
    
    // For "love" votes, immediately mark as a winner
    if (voteType === 'love') {
      console.log("Love vote detected. Marking concept as winner:", conceptId);
      
      // Update the tshirt with winning concept id
      try {
        const { error: updateError } = await supabase
          .from('tshirts')
          .update({ 
            winning_concept_id: conceptId,
            ready_for_voting: false
          })
          .eq('asin', conceptData.tshirt_asin);
          
        if (updateError) {
          console.error("Error updating tshirt with winning concept:", updateError);
          // Still continue even if there's an error
        } else {
          console.log(`Tshirt ${conceptData.tshirt_asin} updated with winning concept ${conceptId}`);
          
          // Record this as completed
          try {
            await supabase
              .from('completed_votings')
              .upsert({ 
                asin: conceptData.tshirt_asin,
                user_id: session.user.id
              });
          } catch (completionError) {
            console.error("Error recording completion:", completionError);
          }
        }
      } catch (error) {
        console.error("Error updating tshirt with winning concept:", error);
      }
    } else if (voteType === 'like') {
      // Check if this vote resulted in a winning concept (2+ likes)
      const { data: updatedConcept } = await supabase
        .from('concepts')
        .select('votes_up, tshirt_asin')
        .eq('concept_id', conceptId)
        .single();
        
      if (updatedConcept && updatedConcept.votes_up >= 2) {
        console.log("This like vote created a winning concept (2+ likes):", conceptId);
        
        // Update the tshirt with winning concept id
        try {
          const { error: updateError } = await supabase
            .from('tshirts')
            .update({ 
              winning_concept_id: conceptId,
              ready_for_voting: false
            })
            .eq('asin', updatedConcept.tshirt_asin);
            
          if (updateError) {
            console.error("Error updating tshirt with winning concept:", updateError);
          } else {
            console.log(`Tshirt ${updatedConcept.tshirt_asin} updated with winning concept ${conceptId}`);
            
            // Record this as completed
            try {
              await supabase
                .from('completed_votings')
                .upsert({ 
                  asin: updatedConcept.tshirt_asin,
                  user_id: session.user.id
                });
            } catch (completionError) {
              console.error("Error recording completion:", completionError);
            }
          }
        } catch (error) {
          console.error("Error updating tshirt with winning concept:", error);
        }
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
    
    // For "love" votes, immediately mark as a winner
    if (newVoteType === 'love') {
      console.log("Love vote detected. Marking concept as winner:", conceptId);
      
      // Update the tshirt with winning concept id
      try {
        const { error: updateError } = await supabase
          .from('tshirts')
          .update({ 
            winning_concept_id: conceptId,
            ready_for_voting: false
          })
          .eq('asin', conceptData.tshirt_asin);
          
        if (updateError) {
          console.error("Error updating tshirt with winning concept:", updateError);
          // Still continue even if there's an error
        } else {
          console.log(`Tshirt ${conceptData.tshirt_asin} updated with winning concept ${conceptId}`);
          
          // Record this as completed
          try {
            await supabase
              .from('completed_votings')
              .upsert({ 
                asin: conceptData.tshirt_asin,
                user_id: session.user.id
              });
          } catch (completionError) {
            console.error("Error recording completion:", completionError);
          }
        }
      } catch (error) {
        console.error("Error updating tshirt with winning concept:", error);
      }
    } else if (newVoteType === 'like') {
      // Check if this vote resulted in a winning concept (2+ likes)
      const { data: updatedConcept } = await supabase
        .from('concepts')
        .select('votes_up, tshirt_asin')
        .eq('concept_id', conceptId)
        .single();
        
      if (updatedConcept && updatedConcept.votes_up >= 2) {
        console.log("This like vote created a winning concept (2+ likes):", conceptId);
        
        // Update the tshirt with winning concept id
        try {
          const { error: updateError } = await supabase
            .from('tshirts')
            .update({ 
              winning_concept_id: conceptId,
              ready_for_voting: false
            })
            .eq('asin', updatedConcept.tshirt_asin);
            
          if (updateError) {
            console.error("Error updating tshirt with winning concept:", updateError);
          } else {
            console.log(`Tshirt ${updatedConcept.tshirt_asin} updated with winning concept ${conceptId}`);
            
            // Record this as completed
            try {
              await supabase
                .from('completed_votings')
                .upsert({ 
                  asin: updatedConcept.tshirt_asin,
                  user_id: session.user.id
                });
            } catch (completionError) {
              console.error("Error recording completion:", completionError);
            }
          }
        } catch (error) {
          console.error("Error updating tshirt with winning concept:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in switchUserVote:", error);
    throw error;
  }
};
