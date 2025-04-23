
// Main Image Voting Hook (Refactored)
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

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevConceptCountRef = useRef<number>(0);

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
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asin, useTestData]);

  useEffect(() => {
    if (regenerating && !useTestData) {
      pollIntervalRef.current = setInterval(async () => {
        await fetchImages();
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
    useTestData,
    toggleDataSource,
  };
};
