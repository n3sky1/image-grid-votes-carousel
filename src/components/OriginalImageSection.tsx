import { ImageData } from "@/types/image";
import { Button } from "@/components/ui/button";
import ImageCard from "./ImageCard";
import { PencilIcon, CopyrightIcon, BanIcon, XIcon } from "lucide-react";
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
  promptText,
  onOriginalAction,
  onEditPrompt,
  onToggleDataSource,
  useTestData,
}: OriginalImageSectionProps) => {
  return (
    <div className="flex flex-col md:flex-row w-full">
      <div className="md:w-1/2 p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        {originalImage ? (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden">
              <ImageCard
                image={originalImage}
                className="w-full h-auto max-h-[350px] object-contain mx-auto shadow-sm"
              />
            </div>
            <div className="flex justify-center gap-6 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onOriginalAction("copyrighted")}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                      aria-label="Mark as copyrighted"
                    >
                      <CopyrightIcon 
                        className="h-6 w-6 text-gray-500 group-hover:text-blue-500 transition-colors" 
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
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                      aria-label="Mark as no design"
                    >
                      <BanIcon 
                        className="h-6 w-6 text-gray-500 group-hover:text-red-500 transition-colors" 
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
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                      aria-label="Mark as can't design"
                    >
                      <XIcon 
                        className="h-6 w-6 text-gray-500 group-hover:text-red-500 transition-colors" 
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
      </div>

      <div className="md:w-1/2 p-6 bg-gradient-to-br from-blue-50 to-purple-50 space-y-6">
        <div className="bg-white/80 rounded-lg p-5 shadow-sm border border-blue-100 relative group">
          <div className="text-base font-bold mb-2 text-gray-800 flex justify-between items-center">
            <span>Generation Prompt</span>
            <button 
              onClick={onEditPrompt}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
              aria-label="Edit prompt"
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <div className="text-gray-700 max-h-[150px] overflow-y-auto text-sm">{promptText}</div>
        </div>
        
        <div className="flex flex-wrap gap-3">
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
