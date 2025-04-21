
import { ImageData } from "@/types/image";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  image: ImageData;
  className?: string;
  animateExit?: boolean;
}

const ImageCard = ({ image, className, animateExit = false }: ImageCardProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg transition-all duration-300", 
        animateExit && "animate-scale-out",
        className
      )}
    >
      <img 
        src={image.src} 
        alt={image.alt} 
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {image.isOriginal && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded-md opacity-90">
          Original
        </div>
      )}
    </div>
  );
};

export default ImageCard;
