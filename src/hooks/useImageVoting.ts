
import { useState, useEffect, useRef } from "react";
import { ImageData } from "@/types/image";
import { fetchSampleImages, fetchSupabaseImages } from "./useImageVoting.supabase";
import { isValidUUID, generateUUID } from "./useImageVoting.utils";
import { UseImageVotingState } from "./useImageVoting.types";

export const useImageVoting = (asin: string): UseImageVotingState => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [conceptImages, setConceptImages] = useState<ImageData[]>([]);
  const [votedImages, setVotedImages] = useState<Record<string, 'like' | 'dislike' | 'love'>>({});
  const [repairedImages, setRepairedImages] = useState<Record<string, boolean>>({});
  const [allVoted, setAllVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [useTestData, setUseTestData] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegeneratingOverlay, setShowRegeneratingOverlay] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevConceptCountRef = useRef<number>(0);
  const lastRegeneratingStatusRef = useRef<boolean>(false);

  const fetchImages = async () => {
    if (useTestData) {
      setLoading(true);
      setError(null);
      const sample = fetchSampleImages();
      setOriginalImage(sample.originalImage);
      setConceptImages(sample.conceptImages);
      setPromptText(sample.promptText);
      setLoading(false);
      return;
    } else {
      // Check if we're currently regenerating
      const currentlyRegenerating = lastRegeneratingStatusRef.current;
      
      // Only perform the full update if we're not regenerating or if regeneration just completed
      if (!regenerating || (currentlyRegenerating && !regenerating)) {
        await fetchSupabaseImages(
          asin,
          setOriginalImage,
          setConceptImages,
          setPromptText,
          setRepairedImages,
          setLoading,
          setError,
          setRegenerating,
          prevConceptCountRef
        );
      } else {
        // If regenerating, just check the regenerate status without updating images
        await fetchSupabaseImages(
          asin,
          () => {}, // Skip updating original image during regeneration
          () => {}, // Skip updating concept images during regeneration
          () => {}, // Skip updating prompt text during regeneration
          () => {}, // Skip updating repair status during regeneration
          () => {}, // Don't change loading state
          setError,
          setRegenerating,
          prevConceptCountRef
        );
      }
      
      // Update last regenerating status
      lastRegeneratingStatusRef.current = regenerating;
    }
  };

  useEffect(() => {
    console.log("Current promptText in useImageVoting:", promptText);
  }, [promptText]);

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asin, useTestData]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      console.log("Stopping polling interval");
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setShowRegeneratingOverlay(false);
  };

  useEffect(() => {
    stopPolling();
    
    if (regenerating && !useTestData) {
      console.log("Starting polling for regenerated images");
      setShowRegeneratingOverlay(true);
      pollIntervalRef.current = setInterval(async () => {
        console.log("Polling for new images...");
        await fetchImages();
      }, 5000);
    } else if (!regenerating && lastRegeneratingStatusRef.current) {
      // If regeneration just completed, refresh images once
      console.log("Regeneration completed, refreshing images once");
      setShowRegeneratingOverlay(false);
      fetchImages();
    }

    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPromptText,
    useTestData,
    toggleDataSource,
    fetchImages,
    showRegeneratingOverlay,
  };
};
