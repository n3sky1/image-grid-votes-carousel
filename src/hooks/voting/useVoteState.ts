
import { useState, useEffect } from 'react';
import { VotedImagesMap, RepairedImagesMap } from './types';
import { ImageData } from "@/types/image";

export const useVoteState = (conceptImages: ImageData[]) => {
  const [votedImages, setVotedImages] = useState<VotedImagesMap>({});
  const [repairedImages, setRepairedImages] = useState<RepairedImagesMap>({});
  const [allVoted, setAllVoted] = useState(false);

  useEffect(() => {
    const nonOriginalCount = conceptImages.length;
    if (nonOriginalCount === 0) return;
    
    const votedCount = Object.keys(votedImages).length;
    const allConceptsVoted = votedCount >= nonOriginalCount;
    
    if (allConceptsVoted !== allVoted) {
      setAllVoted(allConceptsVoted);
    }
  }, [votedImages, conceptImages, allVoted]);

  return {
    votedImages,
    setVotedImages,
    repairedImages,
    setRepairedImages,
    allVoted,
  };
};
