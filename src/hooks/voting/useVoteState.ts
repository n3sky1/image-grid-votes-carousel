
import { useState, useEffect } from 'react';
import { VotedImagesMap, RepairedImagesMap } from './types';
import { ImageData } from "@/types/image";
import { saveUserVote, removeUserVote, switchUserVote } from "@/services/voteService";
import { toast } from "@/components/ui/sonner";

export const useVoteState = (conceptImages: ImageData[]) => {
  const [votedImages, setVotedImages] = useState<VotedImagesMap>({});
  const [repairedImages, setRepairedImages] = useState<RepairedImagesMap>({});
  const [allVoted, setAllVoted] = useState(false);

  useEffect(() => {
    // Only consider concepts that are not original images
    const conceptsToVoteOn = conceptImages.filter(image => !image.isOriginal);
    
    if (conceptsToVoteOn.length === 0) return;
    
    // Count how many concepts have votes
    // We need to filter votedImages to only include IDs that are in our current conceptsToVoteOn
    const votedCount = Object.keys(votedImages).filter(id => 
      conceptsToVoteOn.some(concept => concept.id === id)
    ).length;
    
    // All concepts are voted when votedCount equals the number of concepts to vote on
    const allConceptsVoted = votedCount >= conceptsToVoteOn.length;
    
    if (allConceptsVoted !== allVoted) {
      console.log(`Setting allVoted to ${allConceptsVoted} (${votedCount}/${conceptsToVoteOn.length} concepts voted)`);
      setAllVoted(allConceptsVoted);
    }
  }, [votedImages, conceptImages, allVoted]);
  
  const handleSetVotedImages = async (id: string, vote: 'like' | 'dislike' | 'love'): Promise<void> => {
    const currentVote = votedImages[id];
    
    try {
      // Update the UI immediately to show responsiveness, especially important for love votes
      if (currentVote === vote) {
        // Removing a vote
        const newVotes = { ...votedImages };
        delete newVotes[id];
        setVotedImages(newVotes);
      } else {
        // Adding or changing a vote
        setVotedImages(prev => ({ ...prev, [id]: vote }));
      }
      
      // If voting the same as current vote, remove the vote
      if (currentVote === vote) {
        await removeUserVote(id);
      } 
      // If changing from one vote type to another
      else if (currentVote) {
        await switchUserVote(id, vote, currentVote);
      } 
      // If new vote
      else {
        await saveUserVote(id, vote);
      }
    } catch (error) {
      console.error("Error handling vote:", error);
      // Revert the optimistic update if there was an error
      if (currentVote) {
        setVotedImages(prev => ({ ...prev, [id]: currentVote }));
      } else {
        setVotedImages(prev => {
          const newVotes = { ...prev };
          delete newVotes[id];
          return newVotes;
        });
      }
      
      toast.error("Failed to save vote", {
        description: "Please try again",
      });
      
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
