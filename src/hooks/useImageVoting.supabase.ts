
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
  const { error: insertError } = await supabase
    .from("tshirts")
    .insert({
      asin: asin,
      original_image_url: "https://m.media-amazon.com/images/I/71zAlj7yDrL._AC_UL1500_.jpg",
      title: `Demo T-shirt (${asin})`
    });

  if (insertError) {
    console.error("Error initializing tshirt:", insertError);
    throw new Error("Failed to initialize the database. Please try again.");
  }

  const conceptUrls = [
    "https://m.media-amazon.com/images/I/61pDu-GrM6L._AC_UL1500_.jpg",
    "https://m.media-amazon.com/images/I/61HMbj5KySL._AC_UL1500_.jpg",
    "https://m.media-amazon.com/images/I/71nfRQUb3uL._AC_UL1500_.jpg"
  ];

  for (const url of conceptUrls) {
    await supabase
      .from("concepts")
      .insert({
        tshirt_asin: asin,
        concept_url: url
      });
  }

  console.log("Sample concepts added");
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
      .select("original_image_url, asin, generated_image_description, regenerate")
      .eq("asin", asin)
      .maybeSingle();

    if (tshirtError) {
      console.error("Error fetching tshirt:", tshirtError);
      setError("Failed to load the original image for this ASIN.");
      setLoading(false);
      return;
    }

    if (!tshirt || !tshirt.original_image_url) {
      setError("No image found for this ASIN.");
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
    const { data: concepts, error: conceptError } = await supabase
      .from("concepts")
      .select("concept_id, concept_url, repair_requested")
      .eq("tshirt_asin", asin);

    if (conceptError) {
      console.error("Error fetching concepts:", conceptError);
      setError("Failed to load concept images.");
      setLoading(false);
      return;
    }

    // Set the repaired images state from the fetched data
    const repairStates: Record<string, boolean> = {};
    concepts?.forEach((concept: any) => {
      if (concept.repair_requested) {
        repairStates[concept.concept_id] = true;
      }
    });
    setRepairedImages(repairStates);

    setConceptImages(
      (concepts || []).map((c: any) => ({
        id: c.concept_id,
        src: c.concept_url,
        alt: "Concept Design",
        isOriginal: false,
      }))
    );

    if (typeof tshirt.regenerate === "boolean") setRegenerating(tshirt.regenerate);
    prevConceptCountRef.current = (concepts || []).length;
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again later.");
  } finally {
    setLoading(false);
  }
};
