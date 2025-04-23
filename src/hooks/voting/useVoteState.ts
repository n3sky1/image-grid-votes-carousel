
import { useState, useEffect } from 'react';
import { VotedImagesMap, RepairedImagesMap } from './types';
import { ImageData } from "@/types/image";
import { saveUserVote, removeUserVote, switchUserVote } from "@/services/voteService";

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
  
  const handleSetVotedImages = async (id: string, vote: 'like' | 'dislike' | 'love'): Promise<void> => {
    const currentVote = votedImages[id];
    
    try {
      // If voting the same as current vote, remove the vote
      if (currentVote === vote) {
        await removeUserVote(id);
        setVotedImages(prev => {
          const newVotes = { ...prev };
          delete newVotes[id];
          return newVotes;
        });
      } 
      // If changing from one vote type to another
      else if (currentVote) {
        await switchUserVote(id, vote, currentVote);
        setVotedImages(prev => ({ ...prev, [id]: vote }));
      } 
      // If new vote
      else {
        await saveUserVote(id, vote);
        setVotedImages(prev => ({ ...prev, [id]: vote }));
      }
    } catch (error) {
      console.error("Error handling vote:", error);
      throw error;
    }
  };

  return {
    votedImages,
    setVotedImages: handleSetVotedImages,
    repairedImages,
    setRepairedImages,
    allVoted,
  };
};
