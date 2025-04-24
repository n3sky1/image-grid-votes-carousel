import { ImageData } from "@/types/image";
import { Button } from "@/components/ui/button";
import { AlertCircle, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImageCard from "./ImageCard";

interface OriginalImageSectionProps {
  originalImage: ImageData | null;
  promptText: string;
  onOriginalAction: (action: "copyrighted" | "no-design" | "cant-design") => void;
  onEditPrompt: () => void;
  onToggleDataSource: () => void;
  useTestData: boolean;
  suggestedTags?: string[];
  totalReadyCount?: number;
  userCompletedCount?: number;
}

const OriginalImageSection = ({
  originalImage,
  promptText,
  onOriginalAction,
  onEditPrompt,
  onToggleDataSource,
  useTestData,
  suggestedTags,
  totalReadyCount,
  userCompletedCount
}: OriginalImageSectionProps) => {
  if (!originalImage) {
    return (
      <Alert variant="destructive" className="min-h-[200px] flex items-center justify-center">
        <AlertCircle className="h-6 w-6" />
        <AlertDescription className="ml-2">
          No original image available. Please try another product.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Original Image</h2>
        {totalReadyCount !== undefined && userCompletedCount !== undefined && (
          <div className="text-sm text-gray-500">
            Design {userCompletedCount} of {totalReadyCount} to Review
          </div>
        )}
      </div>
      
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <AspectRatio ratio={1}>
          <ImageCard image={originalImage} className="w-full h-full object-cover" />
        </AspectRatio>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onOriginalAction("copyrighted")}
          className="text-xs"
        >
          Copyrighted
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onOriginalAction("no-design")}
          className="text-xs"
        >
          No Design
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onOriginalAction("cant-design")}
          className="text-xs"
        >
          Can't Design
        </Button>
      </div>
    </div>
  );
};

export default OriginalImageSection;
