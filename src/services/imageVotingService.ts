import { supabase } from "@/integrations/supabase/client";
import { ImageData } from "@/types/image";
import { fetchSampleImages } from "./sampleImageService";
import { initializeTshirt } from "./tshirtService";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export const fetchSupabaseImages = async (
  asin: string,
  setOriginalImage: SetState<ImageData | null>,
  setConceptImages: SetState<ImageData[]>,
  setPromptText: SetState<string>,
  setRepairedImages: SetState<Record<string, boolean>>,
  setLoading: SetState<boolean>,
  setError: SetState<string | null>,
  setRegenerating: SetState<boolean>,
  prevConceptCountRef: React.MutableRefObject<number>,
  setVotedImages: SetState<Record<string, 'like' | 'dislike' | 'love'>>
) => {
  setLoading(true);
  setError(null);

  try {
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Auth error:", authError);
      setError("Authentication error. Please try logging in again.");
      setLoading(false);
      return;
    }

    if (!session) {
      console.error("No session found");
      setError("Please log in to view t-shirts.");
      setLoading(false);
      return;
    }
    
    console.log("Fetching images for ASIN:", asin);
    
    const { data: tshirtStatus, error: statusError } = await supabase
      .from("tshirts")
      .select("ready_for_voting, ai_processing_status, regenerate")
      .eq("asin", asin)
      .maybeSingle();
    
    if (statusError) {
      console.error("Error checking tshirt status:", statusError);
      setError("Failed to check if the t-shirt is ready for voting.");
      setLoading(false);
      return;
    }
    
    if (!tshirtStatus || !tshirtStatus.ready_for_voting) {
      console.error("Tshirt is not ready for voting", tshirtStatus);
      setError(`This t-shirt (ASIN: ${asin}) is not ready for voting. ${
        tshirtStatus?.ai_processing_status 
          ? `Current status: ${tshirtStatus.ai_processing_status}` 
          : 'No status available.'
      }`);
      setLoading(false);
      return;
    }

    // Set regenerating status
    if (typeof tshirtStatus?.regenerate === "boolean") {
      console.log("Setting regenerating state to:", tshirtStatus.regenerate);
      setRegenerating(tshirtStatus.regenerate);
    } else {
      setRegenerating(false);
    }
    
    // If we're just checking regenerate status, return early
    if (tshirtStatus?.regenerate) {
      setLoading(false);
      return;
    }
    
    const { data: tshirt, error: tshirtError } = await supabase
      .from("tshirts")
      .select("original_image_url, ai_image_description, generated_image_description")
      .eq("asin", asin)
      .maybeSingle();

    if (tshirtError || !tshirt) {
      console.error("Error fetching tshirt:", tshirtError);
      setError("Failed to load the t-shirt data.");
      setLoading(false);
      return;
    }

    if (!tshirt.original_image_url) {
      setError(`This t-shirt (ASIN: ${asin}) doesn't have an original image.`);
      setLoading(false);
      return;
    }
    
    setOriginalImage({
      id: `original-${asin}`,
      src: tshirt.original_image_url,
      alt: "Original T-shirt Design",
      isOriginal: true,
    });

    const promptText = tshirt?.ai_image_description || tshirt?.generated_image_description || "No description available.";
    console.log("Setting prompt text:", promptText);
    setPromptText(promptText);
    
    const { data: conceptData, error: conceptError } = await supabase
      .from("concepts")
      .select("*")
      .eq("tshirt_asin", asin)
      .eq("status", "active");

    if (conceptError) {
      console.error("Error fetching concepts:", conceptError);
      setError("Failed to load concept images.");
      setLoading(false);
      return;
    }

    console.log(`Found ${conceptData?.length || 0} concepts for ASIN ${asin}`);
    
    const repairStates: Record<string, boolean> = {};
    conceptData?.forEach((concept: any) => {
      if (concept.repair_requested) {
        repairStates[concept.concept_id] = true;
      }
    });
    setRepairedImages(repairStates);

    setConceptImages(
      (conceptData || []).map((c: any) => ({
        id: c.concept_id,
        src: c.concept_url,
        alt: "Concept Design",
        isOriginal: false,
      }))
    );
    
    prevConceptCountRef.current = conceptData?.length || 0;

    // Fetch user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from('user_votes')
      .select('concept_id, vote_type')
      .eq('user_id', session.user.id);

    if (votesError) {
      console.error("Error fetching user votes:", votesError);
    } else if (userVotes) {
      const votesMap: Record<string, 'like' | 'dislike' | 'love'> = {};
      userVotes.forEach(vote => {
        votesMap[vote.concept_id] = vote.vote_type as 'like' | 'dislike' | 'love';
      });
      setVotedImages(votesMap);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};

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

    // Use direct update instead of the RPC function
    const updateData: Record<string, number> = {};
    
    if (voteType === 'like') updateData.votes_up = 1;
    if (voteType === 'dislike') updateData.votes_down = 1;
    if (voteType === 'love') updateData.hearts = 1;

    // Call the API endpoint with proper CORS handling
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

    // Call the API endpoint to decrement vote counts
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
