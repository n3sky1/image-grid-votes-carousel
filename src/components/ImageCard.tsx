
import { ImageData } from "@/types/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ImageCardProps {
  image: ImageData;
  className?: string;
  animateExit?: boolean;
}

const ImageCard = ({ image, className, animateExit = false }: ImageCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Ensure image src is a valid URL
  const imageSrc = image.src || "";
  
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
          Image could not be loaded
        </div>
      ) : (
        <img 
          src={imageSrc} 
          alt={image.alt} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
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
