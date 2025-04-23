import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Database, AlertCircle } from "lucide-react";
import TagVoting from "./TagVoting";
import { OriginalImageSectionProps } from "@/types/props";
import ImageCard from "./ImageCard";

const OriginalImageSection = ({
  originalImage,
  promptText,
  onOriginalAction,
  onEditPrompt,
  onToggleDataSource,
  useTestData,
  suggestedTags = [],
}: OriginalImageSectionProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-800">T-Shirt Design</h2>
        </div>

        {originalImage ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <AspectRatio ratio={1}>
              <ImageCard image={originalImage} className="w-full h-full object-cover" />
            </AspectRatio>
          </div>
        ) : (
          <Card className="bg-gray-50 flex items-center justify-center h-[300px]">
            <CardContent className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2" />
              No image available
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-2 mt-4">
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

      <TagVoting asin={originalImage?.id.replace('original-', '') || ''} suggestedTags={suggestedTags} />
    </div>
  );
};

export default OriginalImageSection;
