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
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};
