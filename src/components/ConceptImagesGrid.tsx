import { useState } from "react";
import { ImageData } from "@/types/image";
import GridImageCard from "./GridImageCard";
import ConceptImageModal from "./ConceptImageModal";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
      <Alert variant="destructive" className="min-h-[200px] flex items-center justify-center rounded-lg bg-amber-50 border-amber-200">
        <AlertCircle className="h-6 w-6 text-amber-500" />
        <div className="ml-4">
          <AlertTitle className="text-amber-700 font-medium">No Concept Images Available</AlertTitle>
          <AlertDescription className="text-amber-600">
            There are currently no concept images available for this t-shirt. This could be due to image loading issues.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Display up to 8 images, in a fixed 2 rows by 4 columns grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto" style={{gridAutoRows: '1fr'}}>
      {conceptImages.slice(0, 8).map((image) => (
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
