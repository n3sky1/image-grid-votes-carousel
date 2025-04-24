import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: ImageData[];
  onVote: (id: string, vote: 'like' | 'dislike' | 'love') => void;
}

const ImageCarousel = ({ images, onVote }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votingImage, setVotingImage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const comparisonImages = images.filter(img => !img.isOriginal);
  
  if (comparisonImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50 text-gray-500">
        <p className="text-lg font-medium">All images have been voted on</p>
        <p className="text-sm mt-2">Thank you for your contribution!</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (votingImage) return;
    setCurrentIndex((prev) => (prev === 0 ? comparisonImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (votingImage) return;
    setCurrentIndex((prev) => (prev === comparisonImages.length - 1 ? 0 : prev + 1));
  };

  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    setVotingImage(id);
    
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      onVote(id, vote);
      setVotingImage(null);
      if (currentIndex >= comparisonImages.length - 1) {
        setCurrentIndex(Math.max(0, comparisonImages.length - 2));
      }
    }, 300);
  };

  const currentImage = comparisonImages[currentIndex];

  return (
    <div className="flex flex-col rounded-lg shadow-md bg-white overflow-hidden">
      <div className="text-sm px-4 pt-3 pb-2 border-b">
        <p className="font-medium">{currentImage.alt}</p>
        <p className="text-gray-500 text-xs">Design {currentIndex + 1} of {comparisonImages.length}</p>
      </div>
      <div className="relative aspect-video">
        <ImageCard 
          image={currentImage} 
          className="w-full h-full" 
          animateExit={votingImage === currentImage.id}
        />
        
        {comparisonImages.length > 1 && (
          <>
            <button 
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Previous image"
              disabled={!!votingImage}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Next image"
              disabled={!!votingImage}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      
      <div className="flex justify-center gap-4 p-4 border-t">
        <button
          onClick={() => handleVote(currentImage.id, 'dislike')}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Dislike"
          disabled={!!votingImage}
        >
          <ThumbsDown size={18} />
          <span>Dislike</span>
        </button>
        
        <button
          onClick={() => handleVote(currentImage.id, 'like')}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Like"
          disabled={!!votingImage}
        >
          <ThumbsUp size={18} />
          <span>Like</span>
        </button>
        
        <button
          onClick={() => handleVote(currentImage.id, 'love')}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Love"
          disabled={!!votingImage}
        >
          <Heart size={18} />
          <span>Love</span>
        </button>
      </div>
      
      {comparisonImages.length > 1 && (
        <div className="flex justify-center gap-1 pb-4">
          {comparisonImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all", 
                idx === currentIndex ? "bg-blue-600 w-4" : "bg-gray-300"
              )}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
