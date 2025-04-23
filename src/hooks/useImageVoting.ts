
import { useState } from "react";
import { UseImageVotingState } from "./useImageVoting.types";
import { useImageFetching } from "./voting/useImageFetching";
import { useVoteState } from "./voting/useVoteState";
import { useRegenerationState } from "./voting/useRegenerationState";

export const useImageVoting = (asin: string): UseImageVotingState => {
  const [useTestData, setUseTestData] = useState(false);
  
  const {
    originalImage,
    conceptImages,
    promptText,
    loading,
    error,
    setPromptText,
    fetchImages: baseFetchImages,
  } = useImageFetching(asin);

  const {
    votedImages,
    setVotedImages,
    repairedImages,
    setRepairedImages,
    allVoted,
  } = useVoteState(conceptImages);

  const {
    regenerating,
    setRegenerating,
    showRegeneratingOverlay,
    setShowRegeneratingOverlay,
  } = useRegenerationState();

  const fetchImages = async () => {
    // Create an empty function that matches the expected signature for setVotedImages parameter
    const resetVotedImages = () => Promise.resolve();
    
    await baseFetchImages(useTestData, resetVotedImages, setRepairedImages, setRegenerating);
  };

  const toggleDataSource = () => {
    setUseTestData(prev => !prev);
    // We'll handle clearing votes differently since setVotedImages signature has changed
    // Reset votedImages manually in useImageFetching
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
    setShowRegeneratingOverlay,
    setRegenerating,
  };
};
