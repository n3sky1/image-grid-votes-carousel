
import { useState, useEffect } from 'react';
import { VotedImagesMap, RepairedImagesMap } from './types';
import { ImageData } from "@/types/image";
import { saveUserVote, removeUserVote, switchUserVote } from "@/services/voteService";

export const useVoteState = (conceptImages: ImageData[]) => {
  const [votedImages, setVotedImages] = useState<VotedImagesMap>({});
  const [repairedImages, setRepairedImages] = useState<RepairedImagesMap>({});
  const [allVoted, setAllVoted] = useState(false);

  useEffect(() => {
    // Only consider concepts that are not original images
    const conceptsToVoteOn = conceptImages.filter(image => !image.isOriginal);
    
    if (conceptsToVoteOn.length === 0) return;
    
    // Count how many concepts have votes
    const votedCount = Object.keys(votedImages).filter(id => 
      // Make sure the ID exists in our current concepts
      conceptsToVoteOn.some(concept => concept.id === id)
    ).length;
    
    // All concepts are voted when votedCount equals the number of concepts
    const allConceptsVoted = votedCount >= conceptsToVoteOn.length;
    
    if (allConceptsVoted !== allVoted) {
      console.log(`Setting allVoted to ${allConceptsVoted} (${votedCount}/${conceptsToVoteOn.length} concepts voted)`);
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
