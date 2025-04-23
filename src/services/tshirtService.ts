
import { supabase } from "@/integrations/supabase/client";

export const initializeTshirt = async (asin: string) => {
  console.log("Initializing t-shirt for ASIN:", asin);
  
  const { data: existingData, error: checkError } = await supabase
    .from("tshirts")
    .select("asin, ready_for_voting, ai_processing_status, original_image_url, title, generated_image_description")
    .eq("asin", asin)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking for existing tshirt:", checkError);
    throw new Error("Failed to check if the tshirt already exists. Please try again.");
  }
  
  const shouldBeReadyForVoting = 
    existingData?.ai_processing_status === 'image_generated';
    
  console.log("Should be ready for voting:", shouldBeReadyForVoting, "Status:", existingData?.ai_processing_status);
    
  if (existingData) {
    console.log("Existing tshirt found, updating with appropriate ready_for_voting status");
    const { error: updateError } = await supabase
      .from("tshirts")
      .update({
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
    console.log("No existing tshirt found, creating new record with ready_for_voting=false");
    const { error: insertError } = await supabase
      .from("tshirts")
      .insert({
        asin: asin,
        original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
        title: `Demo T-shirt (${asin})`,
        ready_for_voting: false,
        ai_processing_status: null,
        generated_image_description: "A comfortable t-shirt with a modern design, suitable for casual wear."
      });

    if (insertError) {
      console.error("Error initializing tshirt:", insertError);
      throw new Error("Failed to initialize the database. Please try again.");
    }
  }

  await initializeConceptImages(asin, shouldBeReadyForVoting);
};

const initializeConceptImages = async (asin: string, shouldBeReadyForVoting: boolean) => {
  const { data: existingConcepts, error: conceptCheckError } = await supabase
    .from("concepts")
    .select("concept_id")
    .eq("tshirt_asin", asin);
    
  if (conceptCheckError) {
    console.error("Error checking for existing concepts:", conceptCheckError);
    return;
  }
    
  if (existingConcepts && existingConcepts.length > 0) {
    console.log(`Found ${existingConcepts.length} existing concepts, updating status to active`);
    const { error: updateConceptsError } = await supabase
      .from("concepts")
      .update({ status: 'active' })
      .eq("tshirt_asin", asin);
      
    if (updateConceptsError) {
      console.error("Error updating concepts:", updateConceptsError);
    }
  } else if (shouldBeReadyForVoting) {
    await createSampleConcepts(asin);
  } else {
    console.log("Tshirt is not ready for voting, skipping concept creation");
  }
};

const createSampleConcepts = async (asin: string) => {
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
};
