
import { ImageData } from "@/types/image";
import ImageCard from "./ImageCard";
import { CopyrightIcon, BanIcon, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}: OriginalImageSectionProps) => {
  return (
    <>
      {originalImage ? (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden">
            <ImageCard
              image={originalImage}
              className="w-full h-auto max-h-[350px] object-contain mx-auto shadow-sm"
            />
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOriginalAction("copyrighted")}
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    aria-label="Mark as copyrighted"
                  >
                    <CopyrightIcon 
                      className="h-6 w-6 text-gray-600" 
                      strokeWidth={1.5} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copyrighted</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOriginalAction("no-design")}
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    aria-label="Mark as no design"
                  >
                    <BanIcon 
                      className="h-6 w-6 text-gray-600" 
                      strokeWidth={1.5} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>No Design</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOriginalAction("cant-design")}
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    aria-label="Mark as can't design"
                  >
                    <XIcon 
                      className="h-6 w-6 text-gray-600" 
                      strokeWidth={1.5} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Can't Design</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-50 border rounded-lg p-8 h-[200px]">
          <p className="text-gray-500">No original image available</p>
        </div>
      )}
    </>
  );
};

export default OriginalImageSection;
