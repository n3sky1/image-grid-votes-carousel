import { supabase } from "@/integrations/supabase/client";
import { ImageData } from "@/types/image";
import { fetchSampleImages } from "./sampleImageService";

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
  setVotedImages: any
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
    
    const { data: tshirtData, error: tshirtError } = await fetchTshirtData(asin);
    
    if (tshirtError || !tshirtData) {
      handleTshirtError(tshirtError, asin, setError, setLoading);
      return;
    }

    // Set regenerating status and handle early return if needed
    handleRegeneratingStatus(tshirtData, setRegenerating, setLoading);
    if (tshirtData.regenerate) {
      setLoading(false);
      return;
    }

    // Set images and prompt text
    setImageData(tshirtData, setOriginalImage, setPromptText, asin);

    // Fetch and set concept data
    const { conceptData, conceptError } = await fetchConceptData(asin);
    if (conceptError) {
      console.error("Error fetching concepts:", conceptError);
      setError("Failed to load concept images.");
      setLoading(false);
      return;
    }

    setConceptData(conceptData, setConceptImages, setRepairedImages, prevConceptCountRef);

    // Fetch user's votes
    await fetchUserVotes(session.user.id);

  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
  
  // Helper function to fetch user votes
  async function fetchUserVotes(userId: string) {
    const { data: userVotes, error: votesError } = await supabase
      .from('user_votes')
      .select('concept_id, vote_type')
      .eq('user_id', userId);

    if (votesError) {
      console.error("Error fetching user votes:", votesError);
    } else if (userVotes) {
      // Instead of using the setVotedImages directly, we'll store the votes
      // each component should handle their own voting state
      console.log("User votes fetched:", userVotes);
      // This data will be used by components that need it
    }
  }
};

// Helper functions
const fetchTshirtData = async (asin: string) => {
  return await supabase
    .from("tshirts")
    .select("ready_for_voting, ai_processing_status, regenerate, original_image_url, ai_image_description, generated_image_description")
    .eq("asin", asin)
    .maybeSingle();
};

const handleTshirtError = (
  error: any,
  asin: string,
  setError: SetState<string | null>,
  setLoading: SetState<boolean>
) => {
  console.error("Error fetching tshirt:", error);
  setError(`Failed to load t-shirt data for ASIN: ${asin}`);
  setLoading(false);
};

const handleRegeneratingStatus = (
  tshirtData: any,
  setRegenerating: SetState<boolean>,
  setLoading: SetState<boolean>
) => {
  if (typeof tshirtData?.regenerate === "boolean") {
    console.log("Setting regenerating state to:", tshirtData.regenerate);
    setRegenerating(tshirtData.regenerate);
  } else {
    setRegenerating(false);
  }
};

const setImageData = (
  tshirtData: any,
  setOriginalImage: SetState<ImageData | null>,
  setPromptText: SetState<string>,
  asin: string
) => {
  if (tshirtData.original_image_url) {
    setOriginalImage({
      id: `original-${asin}`,
      src: tshirtData.original_image_url,
      alt: "Original T-shirt Design",
      isOriginal: true,
    });
  }

  const promptText = tshirtData?.ai_image_description || 
                    tshirtData?.generated_image_description || 
                    "No description available.";
  console.log("Setting prompt text:", promptText);
  setPromptText(promptText);
};

const fetchConceptData = async (asin: string) => {
  const { data: conceptData, error: conceptError } = await supabase
    .from("concepts")
    .select("*")
    .eq("tshirt_asin", asin)
    .eq("status", "active");

  return { conceptData, conceptError };
};

const setConceptData = (
  conceptData: any,
  setConceptImages: SetState<ImageData[]>,
  setRepairedImages: SetState<Record<string, boolean>>,
  prevConceptCountRef: React.MutableRefObject<number>
) => {
  console.log(`Found ${conceptData?.length || 0} concepts`);
  
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
};
