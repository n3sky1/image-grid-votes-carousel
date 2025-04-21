
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart, Wrench, Check } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ConceptImagesGridProps {
  conceptImages: ImageData[];
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  onVote: (id: string, vote: 'like' | 'dislike' | 'love') => void;
}

const ConceptImagesGrid = ({ conceptImages, votedImages, onVote }: ConceptImagesGridProps) => {
  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-4">
      {conceptImages.map(image => (
        <Card key={image.id} className="overflow-visible border-0 shadow-md group relative h-full">
          <CardContent className="p-2 h-full">
            <div className="relative rounded-lg overflow-hidden h-full">
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
            
            {/* Enlarged hover state with voting controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 
                          ease-in-out scale-0 group-hover:scale-100 origin-center pointer-events-none group-hover:pointer-events-auto">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-[200%] h-auto bg-white shadow-2xl rounded-lg z-30">
                <div className="p-4 flex flex-col">
                  <div className="flex-grow relative rounded-lg overflow-hidden mb-3">
                    <AspectRatio ratio={1 / 1}>
                      <ImageCard 
                        image={image} 
                        className="w-full h-full object-contain"
                      />
                    </AspectRatio>
                  </div>
                  <div className="flex justify-center gap-2 pt-2 bg-white">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'dislike')}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <ThumbsDown size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'like')}
                      className="hover:bg-green-50 hover:text-green-600"
                    >
                      <ThumbsUp size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'love')}
                      className="hover:bg-pink-50 hover:text-pink-600"
                    >
                      <Heart size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Wrench size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConceptImagesGrid;
