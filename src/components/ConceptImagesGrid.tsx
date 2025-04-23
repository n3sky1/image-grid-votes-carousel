import { useState } from "react";
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart, Wrench, X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Comments from "./Comments";
import { supabase } from "@/integrations/supabase/client";

interface ConceptImagesGridProps {
  conceptImages: ImageData[];
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  repairedImages?: Record<string, boolean>;
  onVote: (id: string, vote: 'like' | 'dislike' | 'love') => void;
  onRepair?: (id: string) => void;
  originalImage: ImageData | null;
}

const ConceptImagesGrid = ({ 
  conceptImages, 
  votedImages, 
  repairedImages = {}, 
  onVote, 
  onRepair, 
  originalImage 
}: ConceptImagesGridProps) => {
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    onVote(id, vote);
    
    const currentIndex = conceptImages.findIndex(img => img.id === id);
    if (currentIndex !== -1 && conceptImages.length > 1) {
      const nextIndex = (currentIndex + 1) % conceptImages.length;
      setExpandedImageId(conceptImages[nextIndex].id);
    } else {
      setExpandedImageId(null);
    }
  };

  const handleRepair = async (id: string) => {
    if (onRepair) {
      onRepair(id);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!expandedImageId) return;
    
    const currentIndex = conceptImages.findIndex(img => img.id === expandedImageId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? conceptImages.length - 1 : currentIndex - 1;
    } else {
      newIndex = newIndex = currentIndex === conceptImages.length - 1 ? 0 : currentIndex + 1;
    }
    
    setExpandedImageId(conceptImages[newIndex].id);
  };

  const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-4">
      {conceptImages.map(image => (
        <Card key={image.id} className="overflow-visible border-0 shadow-md group relative h-full">
          <CardContent className="p-2 h-full">
            <div 
              className="relative rounded-lg overflow-hidden h-full cursor-pointer"
              onClick={() => setExpandedImageId(image.id)}
            >
              <AspectRatio ratio={1 / 1}>
                <ImageCard 
                  image={image} 
                  className="w-full h-full object-cover transition-all duration-300" 
                />
                
                {votedImages[image.id] && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md z-10">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </AspectRatio>
            </div>
            
            {expandedImageId === image.id && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white shadow-2xl rounded-lg p-4 relative max-w-[95vw] max-h-[95vh] overflow-auto">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => setExpandedImageId(null)}
                  >
                    <X size={20} />
                  </Button>

                  <div className="flex gap-4">
                    {originalImage && (
                      <div className="w-1/4 space-y-4">
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                          <AspectRatio ratio={1}>
                            <ImageCard 
                              image={originalImage} 
                              className="w-full h-full object-cover" 
                            />
                          </AspectRatio>
                        </div>
                        <div className="mt-4">
                          <Comments conceptId={isValidUUID(expandedImageId) ? expandedImageId : ''} />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="relative rounded-lg overflow-hidden mb-3">
                        <img 
                          src={conceptImages.find(img => img.id === expandedImageId)?.src} 
                          alt={conceptImages.find(img => img.id === expandedImageId)?.alt}
                          className="w-auto h-auto"
                        />
                      </div>
                      {votedImages[expandedImageId] && (
                        <div className="absolute top-[26px] right-[26px] bg-white/90 rounded-full p-4 shadow-md z-10">
                          <Check size={48} className="text-green-500" />
                        </div>
                      )}
                      <div className="flex justify-center gap-2 pt-2 bg-white">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNavigate('prev')}
                          className="hover:bg-gray-100"
                        >
                          <ArrowLeft size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(image.id, 'dislike')}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <ThumbsDown size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(image.id, 'like')}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          <ThumbsUp size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(image.id, 'love')}
                          className="hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Heart size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant={repairedImages[image.id] ? 'default' : 'outline'}
                          onClick={() => handleRepair(image.id)}
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
                          onClick={() => handleNavigate('next')}
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
                  onClick={() => setExpandedImageId(null)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConceptImagesGrid;
