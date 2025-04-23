
import ImageCard from "./ImageCard";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ImageData } from "@/types/image";

interface GridImageCardProps {
  image: ImageData;
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  onExpand: (id: string) => void;
  index: number;
}

const GridImageCard = ({ image, votedImages, onExpand, index }: GridImageCardProps) => (
  <Card className="overflow-visible border-0 shadow-md group relative h-full">
    <CardContent className="p-2 h-full">
      <div
        className="relative rounded-lg overflow-hidden h-full cursor-pointer"
        onClick={() => onExpand(image.id)}
      >
        <AspectRatio ratio={1 / 1}>
          <ImageCard
            image={image}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute top-2 left-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
            <span className="text-sm font-medium text-gray-700">{index + 1}</span>
          </div>
          {votedImages[image.id] && (
            <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md z-10">
              <Check size={16} className="text-green-500" />
            </div>
          )}
        </AspectRatio>
      </div>
    </CardContent>
  </Card>
);

export default GridImageCard;

