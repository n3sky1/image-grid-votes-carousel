
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
        <Card key={image.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-2">
            <div className="relative rounded-lg overflow-hidden group">
              <AspectRatio ratio={1 / 1}>
                <ImageCard 
                  image={image} 
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110" 
                />
                
                {votedImages[image.id] && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md z-10">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'dislike')}
                      className="bg-white/90 hover:bg-red-50 hover:text-red-600"
                    >
                      <ThumbsDown size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'like')}
                      className="bg-white/90 hover:bg-green-50 hover:text-green-600"
                    >
                      <ThumbsUp size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(image.id, 'love')}
                      className="bg-white/90 hover:bg-pink-50 hover:text-pink-600"
                    >
                      <Heart size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Wrench size={16} />
                    </Button>
                  </div>
                </div>
              </AspectRatio>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConceptImagesGrid;
