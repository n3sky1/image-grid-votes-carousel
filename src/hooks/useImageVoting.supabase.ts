
import { supabase } from "@/integrations/supabase/client";
import { sampleImages } from "@/data/sampleImages";
import { isValidUUID, generateUUID } from "./useImageVoting.utils";
import { ImageData } from "@/types/image";

export const fetchSampleImages = () => {
  const original = sampleImages.find(img => img.isOriginal);
  const sampleConceptImages = sampleImages
    .filter(img => !img.isOriginal)
    .map(img => ({
      ...img,
      id: isValidUUID(img.id) ? img.id : generateUUID(),
    }));
  return {
    originalImage: original || null,
    conceptImages: sampleConceptImages,
    promptText: "This is a sample prompt for demonstration purposes. It would normally contain the description used to generate the t-shirt designs.",
  };
};

export const initializeTshirt = async (asin: string) => {
  console.log("Tshirt doesn't exist, initializing...");
  
  // First, check if there are any existing tshirts for this ASIN that might not be ready
  const { data: existingData } = await supabase
    .from("tshirts")
    .select("asin")
    .eq("asin", asin);
    
  // If there's already a record, update it instead of creating a new one
  if (existingData && existingData.length > 0) {
    const { error: updateError } = await supabase
      .from("tshirts")
      .update({
        ready_for_voting: true,
        original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
        title: `Demo T-shirt (${asin})`,
        generated_image_description: "A comfortable t-shirt with a modern design, suitable for casual wear."
      })
      .eq("asin", asin);
      
    if (updateError) {
      console.error("Error updating tshirt:", updateError);
      throw new Error("Failed to update the tshirt record. Please try again.");
    }
  } else {
    // Insert a new tshirt record
    const { error: insertError } = await supabase
      .from("tshirts")
      .insert({
        asin: asin,
        original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
        title: `Demo T-shirt (${asin})`,
        ready_for_voting: true,
        generated_image_description: "A comfortable t-shirt with a modern design, suitable for casual wear."
      });

    if (insertError) {
      console.error("Error initializing tshirt:", insertError);
      throw new Error("Failed to initialize the database. Please try again.");
    }
  }

  // Check for existing concepts
  const { data: existingConcepts } = await supabase
    .from("concepts")
    .select("concept_id")
    .eq("tshirt_asin", asin);
    
  // If we already have concepts, make sure they're set to active status
  if (existingConcepts && existingConcepts.length > 0) {
    const { error: updateConceptsError } = await supabase
      .from("concepts")
      .update({
        status: 'active'  // Using 'status' instead of 'ready_for_voting'
      })
      .eq("tshirt_asin", asin);
      
    if (updateConceptsError) {
      console.error("Error updating concepts:", updateConceptsError);
    }
  } else {
    // Insert new sample concepts if none exist
    const conceptUrls = [
      "https://m.media-amazon.com/images/I/61pDu-GrM6L._AC_UL1500_.jpg",
      "https://m.media-amazon.com/images/I/61HMbj5KySL._AC_UL1500_.jpg",
      "https://m.media-amazon.com/images/I/71nfRQUb3uL._AC_UL1500_.jpg"
    ];

    for (const url of conceptUrls) {
      const { error: conceptError } = await supabase
        .from("concepts")
        .insert({
          tshirt_asin: asin,
          concept_url: url,
          status: 'active'  // Using 'status' instead of 'ready_for_voting'
        });
        
      if (conceptError) {
        console.error("Error adding concept:", conceptError);
      }
    }

    console.log("Sample concepts added");
  }
};

export const fetchSupabaseImages = async (
  asin: string,
  setOriginalImage: (img: ImageData | null) => void,
  setConceptImages: (imgs: ImageData[]) => void,
  setPromptText: (txt: string) => void,
  setRepairedImages: (obj: Record<string, boolean>) => void,
  setLoading: (loading: boolean) => void,
  setError: (err: string | null) => void,
  setRegenerating: (regenerating: boolean) => void,
  prevConceptCountRef: React.MutableRefObject<number>,
) => {
  setLoading(true);
  setError(null);

  try {
    const { data: existingTshirt, error: checkError } = await supabase
      .from("tshirts")
      .select("asin")
      .eq("asin", asin)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for tshirt:", checkError);
    }

    if (!existingTshirt) {
      await initializeTshirt(asin);
    }

    const { data: tshirt, error: tshirtError } = await supabase
      .from("tshirts")
      .select("original_image_url, asin, generated_image_description, regenerate, ready_for_voting")
      .eq("asin", asin)
      .eq("ready_for_voting", true)
      .maybeSingle();

    if (tshirtError) {
      console.error("Error fetching tshirt:", tshirtError);
      setError("Failed to load the original image for this ASIN.");
      setLoading(false);
      return;
    }

    if (!tshirt || !tshirt.original_image_url) {
      setError("No image found for this ASIN or not ready for voting.");
      setLoading(false);
      return;
    }

    setOriginalImage({
      id: `original-${tshirt.asin}`,
      src: tshirt.original_image_url,
      alt: "Original T-shirt Design",
      isOriginal: true,
    });

    setPromptText(tshirt.generated_image_description || "No description available.");
    
    // Use a simpler query approach to avoid the excessive type depth
    const { data: concepts, error: conceptError } = await supabase
      .from("concepts")
      .select("*")
      .eq("tshirt_asin", asin);

    if (conceptError) {
      console.error("Error fetching concepts:", conceptError);
      setError("Failed to load concept images.");
      setLoading(false);
      return;
    }

    // Filter active concepts in JavaScript instead of in the query
    const activeConcepts = concepts?.filter((c: any) => c.status === 'active') || [];

    const repairStates: Record<string, boolean> = {};
    activeConcepts.forEach((concept: any) => {
      if (concept.repair_requested) {
        repairStates[concept.concept_id] = true;
      }
    });
    setRepairedImages(repairStates);

    setConceptImages(
      activeConcepts.map((c: any) => ({
        id: c.concept_id,
        src: c.concept_url,
        alt: "Concept Design",
        isOriginal: false,
      }))
    );

    if (typeof tshirt.regenerate === "boolean") setRegenerating(tshirt.regenerate);
    prevConceptCountRef.current = activeConcepts.length;
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};
