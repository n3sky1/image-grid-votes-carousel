
import { ImageData } from "@/types/image";
import { Button } from "@/components/ui/button";
import ImageCard from "./ImageCard";
import { Card } from "@/components/ui/card";

interface OriginalImageSectionProps {
  originalImage: ImageData | null;
  promptText: string;
  onOriginalAction: (action: "copyrighted" | "no-design" | "cant-design") => void;
  onEditPrompt: () => void;
  onToggleDataSource: () => void;
  useTestData: boolean;
}

const OriginalImageSection = ({
  originalImage,
  promptText,
  onOriginalAction,
  onEditPrompt,
  onToggleDataSource,
  useTestData,
}: OriginalImageSectionProps) => {
  return (
    <div className="flex flex-col md:flex-row w-full">
      {/* Left side - Original Image */}
      <div className="md:w-1/2 p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        {originalImage ? (
          <div className="rounded-lg overflow-hidden">
            <ImageCard
              image={originalImage}
              className="w-full h-auto max-h-[350px] object-contain mx-auto shadow-sm"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-50 border rounded-lg p-8 h-[200px]">
            <p className="text-gray-500">No original image available</p>
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="md:w-1/2 p-6 bg-gradient-to-br from-blue-50 to-purple-50 space-y-6">
        <div className="bg-white/80 rounded-lg p-5 shadow-sm border border-blue-100">
          <div className="text-base font-bold mb-2 text-gray-800">Generation Prompt</div>
          <div className="text-gray-700 max-h-[150px] overflow-y-auto text-sm">{promptText}</div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => onOriginalAction("copyrighted")}
            className="bg-white hover:bg-gray-50"
          >
            Copyrighted
          </Button>
          <Button
            variant="outline"
            onClick={() => onOriginalAction("no-design")}
            className="bg-white hover:bg-gray-50"
          >
            No Design
          </Button>
          <Button
            variant="outline"
            onClick={() => onOriginalAction("cant-design")}
            className="bg-white hover:bg-gray-50"
          >
            Can't Design
          </Button>
          <Button
            variant="outline"
            onClick={onEditPrompt}
            className="bg-white hover:bg-gray-50"
          >
            Edit Prompt
          </Button>
          <Button
            variant={useTestData ? "default" : "outline"}
            onClick={onToggleDataSource}
            className={useTestData ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-50"}
          >
            {useTestData ? "Using Test Data" : "Use Test Data"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OriginalImageSection;
