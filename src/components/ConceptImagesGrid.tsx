
import { useState } from "react";
import { ImageData } from "@/types/image";
import GridImageCard from "./GridImageCard";
import ConceptImageModal from "./ConceptImageModal";

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
