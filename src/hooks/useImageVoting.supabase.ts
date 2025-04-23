
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
  console.log("Initializing t-shirt for ASIN:", asin);
  
  // First, check if there are any existing tshirts for this ASIN
  const { data: existingData, error: checkError } = await supabase
    .from("tshirts")
    .select("asin, ready_for_voting")
    .eq("asin", asin)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking for existing tshirt:", checkError);
    throw new Error("Failed to check if the tshirt already exists. Please try again.");
  }
    
  // If there's already a record, update it to ensure ready_for_voting is true
  if (existingData) {
    console.log("Existing tshirt found, updating ready_for_voting to true");
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
    // Insert a new tshirt record with ready_for_voting explicitly set to true
    console.log("No existing tshirt found, creating new record with ready_for_voting=true");
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

  // Verify that the t-shirt is now ready for voting
  const { data: verifyData, error: verifyError } = await supabase
    .from("tshirts")
    .select("ready_for_voting")
    .eq("asin", asin)
    .maybeSingle();
    
  if (verifyError || !verifyData || !verifyData.ready_for_voting) {
    console.error("Verification failed, tshirt not ready for voting:", verifyError || "No data returned");
    // If verification fails, make one more attempt to fix it
    await supabase
      .from("tshirts")
      .update({ ready_for_voting: true })
      .eq("asin", asin);
  }

  // Check for existing concepts
  const { data: existingConcepts, error: conceptCheckError } = await supabase
    .from("concepts")
    .select("concept_id")
    .eq("tshirt_asin", asin);
    
  if (conceptCheckError) {
    console.error("Error checking for existing concepts:", conceptCheckError);
  }
    
  // If we already have concepts, make sure they're set to active status
  if (existingConcepts && existingConcepts.length > 0) {
    console.log(`Found ${existingConcepts.length} existing concepts, updating status to active`);
    const { error: updateConceptsError } = await supabase
      .from("concepts")
      .update({
        status: 'active'
      })
      .eq("tshirt_asin", asin);
      
    if (updateConceptsError) {
      console.error("Error updating concepts:", updateConceptsError);
    }
  } else {
    // Insert new sample concepts if none exist
    console.log("No existing concepts found, adding sample concepts");
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
          status: 'active'
        });
        
      if (conceptError) {
        console.error("Error adding concept:", conceptError);
      }
    }

    console.log("Sample concepts added successfully");
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
    console.log("Fetching images for ASIN:", asin);
    
    // First check if we have a tshirt record for this ASIN
    const { data: existingTshirt, error: checkError } = await supabase
      .from("tshirts")
      .select("asin, ready_for_voting")
      .eq("asin", asin)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for tshirt:", checkError);
      throw new Error("Failed to check if the tshirt exists. Please try again.");
    }

    // If the tshirt doesn't exist or isn't ready for voting, initialize it
    if (!existingTshirt || !existingTshirt.ready_for_voting) {
      console.log("Tshirt doesn't exist or isn't ready for voting. Initializing...");
      await initializeTshirt(asin);
    }

    // Now fetch the tshirt data
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
      console.error("No tshirt or original image found after initialization attempts");
      setError("No image found for this ASIN or not ready for voting.");
      setLoading(false);
      return;
    }

    console.log("Successfully fetched tshirt:", tshirt);
    setOriginalImage({
      id: `original-${tshirt.asin}`,
      src: tshirt.original_image_url,
      alt: "Original T-shirt Design",
      isOriginal: true,
    });

    setPromptText(tshirt.generated_image_description || "No description available.");
    
    // Fetch active concepts for this tshirt
    const { data: concepts, error: conceptError } = await supabase
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

    console.log(`Found ${concepts?.length || 0} concepts for ASIN ${asin}`);
    
    // Process repair states
    const repairStates: Record<string, boolean> = {};
    concepts?.forEach((concept: any) => {
      if (concept.repair_requested) {
        repairStates[concept.concept_id] = true;
      }
    });
    setRepairedImages(repairStates);

    // Set concept images
    setConceptImages(
      (concepts || []).map((c: any) => ({
        id: c.concept_id,
        src: c.concept_url,
        alt: "Concept Design",
        isOriginal: false,
      }))
    );

    if (typeof tshirt.regenerate === "boolean") setRegenerating(tshirt.regenerate);
    prevConceptCountRef.current = concepts?.length || 0;
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};
