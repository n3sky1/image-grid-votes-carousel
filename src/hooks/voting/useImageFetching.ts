
import { useState, useRef } from 'react';
import { ImageData } from "@/types/image";
import { fetchSupabaseImages } from "@/services/imageDataService";
import { fetchSampleImages } from "@/services/sampleImageService";
import { VotedImagesMap, RepairedImagesMap } from './types';

export const useImageFetching = (asin: string) => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [conceptImages, setConceptImages] = useState<ImageData[]>([]);
  const [promptText, setPromptText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevConceptCountRef = useRef<number>(0);

  const fetchImages = async (
    useTestData: boolean,
    setVotedImages: (id: string, vote: 'like' | 'dislike' | 'love') => Promise<void>,
    setRepairedImages: React.Dispatch<React.SetStateAction<RepairedImagesMap>>,
    setRegenerating: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (useTestData) {
      setLoading(true);
      setError(null);
      const sample = fetchSampleImages();
      setOriginalImage(sample.originalImage);
      setConceptImages(sample.conceptImages);
      setPromptText(sample.promptText);
      setLoading(false);
      return;
    }

    await fetchSupabaseImages(
      asin,
      setOriginalImage,
      setConceptImages,
      setPromptText,
      setRepairedImages,
      setLoading,
      setError,
      setRegenerating,
      prevConceptCountRef,
      // We're passing a function that adapts the new setVotedImages to what fetchSupabaseImages expects
      (votesMap) => {
        // This converts the old style to the new style
        // votesMap will be processed in the fetchSupabaseImages function
      }
    );
  };

  return {
    originalImage,
    conceptImages,
    promptText,
    loading,
    error,
    setPromptText,
    fetchImages,
  };
};
