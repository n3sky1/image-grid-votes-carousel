
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Comments from "./Comments";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, Heart, Wrench, Check } from "lucide-react";
import ImageCard from "./ImageCard";
import { ImageData } from "@/types/image";

interface ConceptImageModalProps {
  conceptImages: ImageData[];
  repairedImages: Record<string, boolean>;
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  expandedImageId: string;
  onClose: () => void;
  onVote: (id: string, vote: 'like' | 'dislike' | 'love') => void;
  onRepair: (id: string) => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  originalImage: ImageData | null;
}

const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const ConceptImageModal = ({
  conceptImages,
  repairedImages,
  votedImages,
  expandedImageId,
  onClose,
  onVote,
  onRepair,
  onNavigate,
  originalImage,
}: ConceptImageModalProps) => {
  const image = conceptImages.find(img => img.id === expandedImageId);

  if (!image) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white shadow-2xl rounded-lg p-4 relative w-full max-w-[95vw] max-h-[90vh] flex flex-col">
        <Button size="icon" variant="ghost" className="absolute right-2 top-2 z-10" onClick={onClose}>
          <X size={20} />
        </Button>
        <div className="flex flex-col md:flex-row gap-4 overflow-auto">
          {originalImage && (
            <div className="w-full md:w-1/4 space-y-4 flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <AspectRatio ratio={1}>
                  <ImageCard image={originalImage} className="w-full h-full object-cover" />
                </AspectRatio>
              </div>
              <div className="mt-4">
                <Comments conceptId={isValidUUID(expandedImageId) ? expandedImageId : ""} />
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative rounded-lg overflow-hidden mb-3 flex-1 flex items-center justify-center">
              <img
                src={image.src}
                alt={image.alt}
                className="max-w-full max-h-[60vh] object-contain"
              />
              {votedImages[expandedImageId] && (
                <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-md z-10">
                  <Check size={32} className="text-green-500" />
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2 pt-2 bg-white mt-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate('prev')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft size={16} />
              </Button>
              <Button
                size="sm"
                variant={votedImages[image.id] === 'dislike' ? "default" : "outline"}
                onClick={() => onVote(image.id, 'dislike')}
                className={`hover:bg-red-50 hover:text-red-600 
                  ${votedImages[image.id] === 'dislike' ? 'bg-red-100 text-red-600' : ''}`}
              >
                <ThumbsDown size={16} />
              </Button>
              <Button
                size="sm"
                variant={votedImages[image.id] === 'like' ? "default" : "outline"}
                onClick={() => onVote(image.id, 'like')}
                className={`hover:bg-green-50 hover:text-green-600 
                  ${votedImages[image.id] === 'like' ? 'bg-green-100 text-green-600' : ''}`}
              >
                <ThumbsUp size={16} />
              </Button>
              <Button
                size="sm"
                variant={votedImages[image.id] === 'love' ? "default" : "outline"}
                onClick={() => onVote(image.id, 'love')}
                className={`hover:bg-pink-50 hover:text-pink-600 
                  ${votedImages[image.id] === 'love' ? 'bg-pink-100 text-pink-600' : ''}`}
              >
                <Heart size={16} />
              </Button>
              <Button
                size="sm"
                variant={repairedImages[image.id] ? 'default' : 'outline'}
                onClick={() => onRepair(image.id)}
                className={`
                  hover:bg-blue-50 
                  hover:text-blue-600 
                  ${repairedImages[image.id]
                      ? 'bg-blue-500 text-white'
                      : ''
                  }`}
              >
                <Wrench size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate('next')}
                className="hover:bg-gray-100"
              >
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed inset-0 bg-black/20 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default ConceptImageModal;
