
import { useState, useEffect, useRef } from "react";
import { ImageData } from "@/types/image";
import { supabase } from "@/integrations/supabase/client";
import { sampleImages } from "@/data/sampleImages";

export const useImageVoting = (asin: string) => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [conceptImages, setConceptImages] = useState<ImageData[]>([]);
  const [votedImages, setVotedImages] = useState<Record<string, 'like' | 'dislike' | 'love'>>({});
  const [repairedImages, setRepairedImages] = useState<Record<string, boolean>>({});
  const [allVoted, setAllVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [useTestData, setUseTestData] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevConceptCountRef = useRef<number>(0);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);

    if (useTestData) {
      const original = sampleImages.find(img => img.isOriginal);
      setOriginalImage(original || null);
      const sampleConceptImages = sampleImages
        .filter(img => !img.isOriginal)
        .map(img => ({
          ...img,
          id: isValidUUID(img.id) ? img.id : generateUUID()
        }));
      setConceptImages(sampleConceptImages);
      setPromptText("This is a sample prompt for demonstration purposes. It would normally contain the description used to generate the t-shirt designs.");
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    fetchImages();
  }, [asin, useTestData]);

  useEffect(() => {
    if (regenerating && !useTestData) {
      pollIntervalRef.current = setInterval(async () => {
        const { data: tshirt } = await supabase
          .from("tshirts")
          .select("regenerate")
          .eq("asin", asin)
          .maybeSingle();

        if (tshirt && tshirt.regenerate === false) {
          clearInterval(pollIntervalRef.current as NodeJS.Timeout);
          pollIntervalRef.current = null;
          setRegenerating(false);
          fetchImages();
        } else {
          fetchImages();
        }
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [regenerating, useTestData, asin]);

  useEffect(() => {
    const nonOriginalCount = conceptImages.length;
    const votedCount = Object.keys(votedImages).length;
    if (votedCount >= nonOriginalCount && nonOriginalCount > 0) {
      setAllVoted(true);
    }
  }, [votedImages, conceptImages]);

  const toggleDataSource = () => {
    setUseTestData(prev => !prev);
    setVotedImages({});
    setRepairedImages({});
  };

  return {
    originalImage,
    conceptImages,
    votedImages,
    setVotedImages,
    repairedImages,
    setRepairedImages,
    allVoted,
    loading,
    error,
    promptText,
    useTestData,
    toggleDataSource
  };
};

const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const initializeTshirt = async (asin: string) => {
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
