
import { useState, useRef, useEffect } from 'react';
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
  const [votedImagesTemp, setVotedImagesTemp] = useState<VotedImagesMap>({});
  const [repairedImagesTemp, setRepairedImagesTemp] = useState<RepairedImagesMap>({});
  const [regeneratingTemp, setRegeneratingTemp] = useState<boolean>(false);
  
  // Initialize the fetch on mount
  useEffect(() => {
    if (asin) {
      const dummySetVotedImages = async (id: string, vote: 'like' | 'dislike' | 'love') => {
        console.log(`Initializing vote: ${id} - ${vote}`);
        setVotedImagesTemp(prev => ({ ...prev, [id]: vote }));
      };
      
      fetchImages(false, dummySetVotedImages, setRepairedImagesTemp, setRegeneratingTemp);
    }
  }, [asin]);

  const fetchImages = async (
    useTestData: boolean,
    setVotedImages: (id: string, vote: 'like' | 'dislike' | 'love') => Promise<void>,
    setRepairedImages: React.Dispatch<React.SetStateAction<RepairedImagesMap>>,
    setRegenerating: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!asin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (useTestData) {
        const sample = fetchSampleImages();
        setOriginalImage(sample.originalImage);
        setConceptImages(sample.conceptImages);
        setPromptText(sample.promptText);
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
          prevConceptCountRef,
          setVotedImages
        );
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      setError("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
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
