
import { useState, useEffect } from "react";
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import ImageCarousel from "./ImageCarousel";
import { toast } from "@/components/ui/sonner";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";

interface ImageVotingGridProps {
  initialImages: ImageData[];
}

const ImageVotingGrid = ({ initialImages }: ImageVotingGridProps) => {
  const [images, setImages] = useState<ImageData[]>(initialImages);
  const [votedImages, setVotedImages] = useState<Record<string, 'like' | 'dislike' | 'love'>>({});
  const [allVoted, setAllVoted] = useState(false);
  
  const originalImage = images.find(img => img.isOriginal);
  
  // Check if all images have been voted
  useEffect(() => {
    const nonOriginalCount = initialImages.filter(img => !img.isOriginal).length;
    const votedCount = Object.keys(votedImages).length;
    
    if (votedCount >= nonOriginalCount && nonOriginalCount > 0) {
      setAllVoted(true);
    }
  }, [votedImages, initialImages]);
  
  const getVoteIcon = (vote: 'like' | 'dislike' | 'love') => {
    switch (vote) {
      case 'like': return <ThumbsUp size={16} className="text-green-500" />;
      case 'dislike': return <ThumbsDown size={16} className="text-gray-500" />;
      case 'love': return <Heart size={16} className="text-red-500" />;
    }
  };
  
  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    // Add the image to voted images with the vote type
    setVotedImages(prev => ({...prev, [id]: vote}));
    
    // Remove the voted image from the carousel
    setImages(prev => prev.filter(img => img.id !== id));
    
    // Show a toast notification
    const voteText = vote === 'like' ? 'Liked' : vote === 'dislike' ? 'Disliked' : 'Loved';
    toast(voteText, {
      description: `You ${voteText.toLowerCase()} this image`,
      position: "bottom-right",
      icon: getVoteIcon(vote)
    });
  };
  
  // Display completion message if all images voted
  if (allVoted) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">All Done!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for reviewing and voting on all the images.
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <ThumbsUp className="text-green-500 mb-2" size={24} />
              <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'like').length}</span>
              <span className="text-sm text-gray-500">Likes</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <ThumbsDown className="text-gray-500 mb-2" size={24} />
              <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'dislike').length}</span>
              <span className="text-sm text-gray-500">Dislikes</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Heart className="text-red-500 mb-2" size={24} />
              <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'love').length}</span>
              <span className="text-sm text-gray-500">Loves</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Original image */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Original Image</h2>
          {originalImage ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg p-4 shadow-md">
              <ImageCard image={originalImage} className="max-h-[500px] w-auto" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 border rounded-lg p-8">
              <p className="text-gray-500">No original image available</p>
            </div>
          )}
        </div>
        
        {/* Comparison images carousel */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Comparison Images</h2>
          <div className="flex-1 flex items-start">
            <ImageCarousel 
              images={images} 
              onVote={handleVote}
            />
          </div>
          
          {/* Voting statistics */}
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Voting Progress</p>
                <p className="text-sm text-gray-600">
                  {Object.keys(votedImages).length} of {initialImages.length - 1} voted
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(Object.keys(votedImages).length / (initialImages.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Vote breakdown */}
              {Object.keys(votedImages).length > 0 && (
                <div className="flex gap-4 mt-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span>{Object.values(votedImages).filter(v => v === 'like').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown size={14} />
                    <span>{Object.values(votedImages).filter(v => v === 'dislike').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    <span>{Object.values(votedImages).filter(v => v === 'love').length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageVotingGrid;
