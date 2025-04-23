
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import TagVoting from "./TagVoting";
import { OriginalImageSectionProps } from "@/types/props";
import ImageCard from "./ImageCard";
import React from "react";

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
        {/* Removed the "T-Shirt Design" heading */}

        {originalImage ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 group transition">
            <AspectRatio ratio={1}>
              <ImageCard image={originalImage} className="w-full h-full object-cover" />
              {/* Action Buttons Overlay - only visible on hover */}
              <div className="absolute left-0 bottom-0 w-full flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOriginalAction("copyrighted")}
                  className="text-xs pointer-events-auto"
                >
                  Copyrighted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOriginalAction("no-design")}
                  className="text-xs pointer-events-auto"
                >
                  No Design
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOriginalAction("cant-design")}
                  className="text-xs pointer-events-auto"
                >
                  Can't Design
                </Button>
              </div>
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

      {/* The action buttons are now overlayed above, not here */}
      {/* <div className="flex gap-2 mt-4"> ... </div> */}

      <TagVoting asin={originalImage?.id.replace('original-', '') || ''} suggestedTags={suggestedTags} />
    </div>
  );
};

export default OriginalImageSection;

