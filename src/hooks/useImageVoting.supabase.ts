
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
    .select("asin, ready_for_voting, ai_processing_status, original_image_url, title, generated_image_description")
    .eq("asin", asin)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking for existing tshirt:", checkError);
    throw new Error("Failed to check if the tshirt already exists. Please try again.");
  }
  
  // Determine if this tshirt should be ready for voting based on processing status
  const shouldBeReadyForVoting = 
    existingData?.ai_processing_status === 'image_generated';
  
  console.log("Should be ready for voting:", shouldBeReadyForVoting, "Status:", existingData?.ai_processing_status);
    
  // If there's already a record, update it respecting the ready_for_voting condition
  if (existingData) {
    console.log("Existing tshirt found, updating with appropriate ready_for_voting status");
    const { error: updateError } = await supabase
      .from("tshirts")
      .update({
        // Only mark as ready if ai_processing_status is 'image_generated'
        ready_for_voting: shouldBeReadyForVoting,
        original_image_url: existingData.original_image_url || "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
        title: existingData.title || `Demo T-shirt (${asin})`,
        generated_image_description: existingData.generated_image_description || "A comfortable t-shirt with a modern design, suitable for casual wear."
      })
      .eq("asin", asin);
      
    if (updateError) {
      console.error("Error updating tshirt:", updateError);
      throw new Error("Failed to update the tshirt record. Please try again.");
    }
  } else {
    // Insert a new tshirt record - for demo purposes, we'll create with ready_for_voting = false
    // since we don't have an ai_processing_status yet
    console.log("No existing tshirt found, creating new record with ready_for_voting=false");
    const { error: insertError } = await supabase
      .from("tshirts")
      .insert({
        asin: asin,
        original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
        title: `Demo T-shirt (${asin})`,
        ready_for_voting: false, // Default to false for new records
        ai_processing_status: null, // No processing status yet
        generated_image_description: "A comfortable t-shirt with a modern design, suitable for casual wear."
      });

    if (insertError) {
      console.error("Error initializing tshirt:", insertError);
      throw new Error("Failed to initialize the database. Please try again.");
    }
  }

  // After update/insert, check actual tshirt status
  const { data: verifyData, error: verifyError } = await supabase
    .from("tshirts")
    .select("ready_for_voting, ai_processing_status")
    .eq("asin", asin)
    .maybeSingle();
    
  if (verifyError) {
    console.error("Verification failed:", verifyError);
  } else {
    console.log("Tshirt status after update:", 
      "ready_for_voting =", verifyData?.ready_for_voting, 
      "ai_processing_status =", verifyData?.ai_processing_status);
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
    // Insert new sample concepts only if tshirt should be ready for voting
    if (shouldBeReadyForVoting) {
      console.log("No existing concepts found and tshirt is ready for voting, adding sample concepts");
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
    } else {
      console.log("Tshirt is not ready for voting, skipping concept creation");
    }
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
      .select("asin, ready_for_voting, ai_processing_status")
      .eq("asin", asin)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for tshirt:", checkError);
      throw new Error("Failed to check if the tshirt exists. Please try again.");
    }

    // If the tshirt doesn't exist, initialize it
    if (!existingTshirt) {
      console.log("Tshirt doesn't exist. Initializing...");
      await initializeTshirt(asin);
    } 
    // If exists but not ready for voting and its status isn't image_generated, show an error
    else if (!existingTshirt.ready_for_voting && existingTshirt.ai_processing_status !== 'image_generated') {
      console.log("Tshirt exists but is not ready for voting and status isn't image_generated");
      setError(`This t-shirt (ASIN: ${asin}) is not ready for voting. Current status: ${existingTshirt.ai_processing_status || 'unknown'}`);
      setLoading(false);
      return;
    }

    // Now fetch the tshirt data
    const { data: tshirt, error: tshirtError } = await supabase
      .from("tshirts")
      .select("original_image_url, asin, generated_image_description, regenerate, ready_for_voting, ai_processing_status")
      .eq("asin", asin)
      .maybeSingle();

    if (tshirtError) {
      console.error("Error fetching tshirt:", tshirtError);
      setError("Failed to load the original image for this ASIN.");
      setLoading(false);
      return;
    }

    if (!tshirt) {
      console.error("No tshirt found after initialization attempts");
      setError(`No tshirt found for ASIN: ${asin}.`);
      setLoading(false);
      return;
    }

    if (!tshirt.ready_for_voting) {
      console.error("Tshirt is not ready for voting", tshirt);
      setError(`This t-shirt (ASIN: ${asin}) is not ready for voting. Current status: ${tshirt.ai_processing_status || 'unknown'}`);
      setLoading(false);
      return;
    }

    if (!tshirt.original_image_url) {
      console.error("Tshirt has no original image URL", tshirt);
      setError(`This t-shirt (ASIN: ${asin}) doesn't have an original image.`);
      setLoading(false);
      return;
    }

    console.log("Successfully fetched tshirt:", tshirt);
    console.log("Original image URL:", tshirt.original_image_url);
    
    setOriginalImage({
      id: `original-${tshirt.asin}`,
      src: tshirt.original_image_url,
      alt: "Original T-shirt Design",
      isOriginal: true,
    });

    setPromptText(tshirt.generated_image_description || "No description available.");
    
    // Fetch active concepts for this tshirt
    let { data: conceptData, error: conceptError } = await supabase
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
    
    if (conceptData && conceptData.length > 0) {
      // Log all concept URLs for debugging
      conceptData.forEach((concept: any, index: number) => {
        console.log(`Concept ${index + 1} URL:`, concept.concept_url);
      });
    } else {
      console.warn("No concepts found for this ASIN");
      if (tshirt.ready_for_voting && tshirt.ai_processing_status === 'image_generated') {
        console.log("Tshirt is ready for voting but has no concepts, trying to create sample concepts");
        await initializeTshirt(asin); // Try to initialize again to create sample concepts
        
        // Try to fetch concepts again
        const { data: refreshedConcepts, error: refreshError } = await supabase
          .from("concepts")
          .select("*")
          .eq("tshirt_asin", asin)
          .eq("status", "active");
          
        if (refreshError) {
          console.error("Error fetching refreshed concepts:", refreshError);
        } else if (refreshedConcepts && refreshedConcepts.length > 0) {
          // Update the concept data with refreshed data instead of reassigning
          conceptData = refreshedConcepts;
          console.log(`Found ${refreshedConcepts.length} concepts after re-initialization`);
        }
      }
    }
    
    // Process repair states
    const repairStates: Record<string, boolean> = {};
    conceptData?.forEach((concept: any) => {
      if (concept.repair_requested) {
        repairStates[concept.concept_id] = true;
      }
    });
    setRepairedImages(repairStates);

    // Set concept images
    setConceptImages(
      (conceptData || []).map((c: any) => ({
        id: c.concept_id,
        src: c.concept_url,
        alt: "Concept Design",
        isOriginal: false,
      }))
    );

    if (typeof tshirt.regenerate === "boolean") setRegenerating(tshirt.regenerate);
    prevConceptCountRef.current = conceptData?.length || 0;
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};
