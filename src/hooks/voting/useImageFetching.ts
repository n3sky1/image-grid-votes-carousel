
import { useState, useRef, useEffect } from 'react';
import { ImageData } from "@/types/image";
import { fetchSupabaseImages } from "@/services/imageDataService";
import { fetchSampleImages } from "@/services/sampleImageService";
import { VotedImagesMap, RepairedImagesMap } from './types';
import { toast } from '@/components/ui/sonner';

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
  const lastFetchTimeRef = useRef<number>(Date.now());
  const fetchInProgressRef = useRef<boolean>(false);
  const fetchAttemptCountRef = useRef<number>(0);
  
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
    
    fetchAttemptCountRef.current += 1;
    const fetchAttempt = fetchAttemptCountRef.current;
    
    console.log(`[Attempt #${fetchAttempt}] Fetching images for ASIN: ${asin}, test data: ${useTestData}`);
    
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log(`[Attempt #${fetchAttempt}] Fetch already in progress, skipping`);
      return;
    }
    
    // Prevent excessive fetches in short time periods
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 1000) { // Debounce to 1 second
      console.log(`[Attempt #${fetchAttempt}] Skipping fetch - too soon after last fetch (${timeSinceLastFetch}ms)`);
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      
      setLoading(true);
      setError(null);
      
      if (useTestData) {
        const sample = fetchSampleImages();
        setOriginalImage(sample.originalImage);
        setConceptImages(sample.conceptImages);
        setPromptText(sample.promptText);
        setLoading(false);
      } else {
        console.log(`[Attempt #${fetchAttempt}] Starting real API fetch for images`);
        
        // Clear existing concepts before fetching new ones
        // This prevents showing stale images while loading
        setConceptImages([]);
        
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
        
        console.log(`[Attempt #${fetchAttempt}] Images fetched successfully`);
      }
    } catch (err) {
      console.error(`[Attempt #${fetchAttempt}] Error fetching images:`, err);
      setError("Failed to load images. Please try again.");
      toast.error("Failed to load images", {
        description: "Please try refreshing the page."
      });
    } finally {
      fetchInProgressRef.current = false;
      
      // Always ensure loading state is turned off
      setLoading(false);
      
      // Add another guaranteed check to turn off loading after a delay
      setTimeout(() => {
        if (loading) {
          console.log(`[Attempt #${fetchAttempt}] Force turning off loading state after delay`);
          setLoading(false);
        }
      }, 2000);
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
