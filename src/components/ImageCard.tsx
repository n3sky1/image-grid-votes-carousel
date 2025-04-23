
import { ImageData } from "@/types/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

interface ImageCardProps {
  image: ImageData;
  className?: string;
  animateExit?: boolean;
}

const ImageCard = ({ image, className, animateExit = false }: ImageCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(image.src || "");
  
  // Reset error state when image source changes
  useEffect(() => {
    setImageError(false);
    setImageSrc(image.src || "");
  }, [image.src]);
  
  // Use a fallback image based on the domain
  const getFallbackImage = (originalSrc: string) => {
    if (originalSrc.includes("storage.googleapis.com/threadmule/originals")) {
      return "/placeholder.svg"; // Fallback for original images
    }
    return "/placeholder.svg"; // General fallback
  };
  
  // Handle image loading error
  const handleImageError = () => {
    console.error(`Failed to load image: ${imageSrc}`);
    
    // Try to get a fallback image
    const fallbackSrc = getFallbackImage(imageSrc);
    
    // Only set error state if we don't have a fallback
    setImageError(true);
  };
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg transition-all duration-300", 
        animateExit && "animate-scale-out",
        className
      )}
    >
      {imageError ? (
        <div className="w-full h-full min-h-32 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          <div className="text-center p-4">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Image could not be loaded</p>
            <p className="text-xs mt-1 text-gray-400">{image.id}</p>
          </div>
        </div>
      ) : (
        <img 
          src={imageSrc} 
          alt={image.alt} 
          className="w-full h-full object-cover"
          loading="lazy"
          crossOrigin="anonymous"
          onError={handleImageError}
        />
      )}
      {image.isOriginal && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded-md opacity-90">
          Original
        </div>
      )}
    </div>
  );
};

export default ImageCard;
