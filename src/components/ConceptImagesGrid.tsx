
import { useState } from "react";
import { ImageData } from "@/types/image";
import GridImageCard from "./GridImageCard";
import ConceptImageModal from "./ConceptImageModal";
import { AlertCircle } from "lucide-react";

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
  originalImage,
}: ConceptImagesGridProps) => {
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

  const handleVote = (id: string, vote: 'like' | 'dislike' | 'love') => {
    onVote(id, vote);
    const currentIndex = conceptImages.findIndex((img) => img.id === id);
    if (currentIndex !== -1 && conceptImages.length > 1) {
      const nextIndex = (currentIndex + 1) % conceptImages.length;
      setExpandedImageId(conceptImages[nextIndex].id);
    } else {
      setExpandedImageId(null);
    }
  };

  const handleRepair = (id: string) => {
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
      newIndex = currentIndex === conceptImages.length - 1 ? 0 : currentIndex + 1;
    }
    setExpandedImageId(conceptImages[newIndex].id);
  };

  // Check if there are no concept images to display
  if (conceptImages.length === 0) {
    return (
      <div className="min-h-[300px] rounded-lg bg-gray-50 flex items-center justify-center p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={40} className="text-amber-500" />
          <p className="text-lg font-medium text-gray-700">No concept images are available for this item</p>
          <p className="text-sm text-gray-500">
            This could be because the t-shirt isn't ready for voting yet or no concepts have been generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-4">
      {conceptImages.map((image) => (
        <GridImageCard
          key={image.id}
          image={image}
          votedImages={votedImages}
          onExpand={setExpandedImageId}
        />
      ))}
      {expandedImageId && (
        <ConceptImageModal
          conceptImages={conceptImages}
          repairedImages={repairedImages}
          votedImages={votedImages}
          expandedImageId={expandedImageId}
          onClose={() => setExpandedImageId(null)}
          onVote={handleVote}
          onRepair={handleRepair}
          onNavigate={handleNavigate}
          originalImage={originalImage}
        />
      )}
    </div>
  );
};

export default ConceptImagesGrid;
