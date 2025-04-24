
import { useState } from "react";
import VotingProgress from "./VotingProgress";
import { useVotingStats } from "@/hooks/useVotingStats";
import PromptEditor from "./PromptEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface VotingSidebarProps {
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  conceptImagesCount: number;
  useTestData: boolean;
  toggleDataSource: () => void;
  promptText: string;
  asin: string;
  onPromptSaved: (prompt: string) => void;
  isEditingPrompt: boolean;
  setIsEditingPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  aiRecommendedModel?: string;
}

const VotingSidebar = ({
  votedImages,
  conceptImagesCount,
  useTestData,
  toggleDataSource,
  promptText,
  asin,
  onPromptSaved,
  isEditingPrompt,
  setIsEditingPrompt,
  aiRecommendedModel
}: VotingSidebarProps) => {
  // Remove the local prompt state as it's not needed
  // We'll use the props directly with PromptEditor

  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Prompt</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPrompt(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Pencil size={12} />
            Edit
          </Button>
        </div>
        {isEditingPrompt ? (
          <PromptEditor
            asin={asin}
            promptText={promptText}
            onPromptSaved={onPromptSaved}
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {promptText}
          </p>
        )}
      </div>
      
      {aiRecommendedModel && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium mb-2">AI Model</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{aiRecommendedModel}</Badge>
          </div>
        </div>
      )}
      
      <VotingProgress 
        votedImages={votedImages} 
        conceptImagesCount={conceptImagesCount} 
      />

      {process.env.NODE_ENV === "development" && (
        <div className="bg-slate-100 p-4 rounded-lg text-xs space-y-2 border border-slate-200">
          <p className="font-medium">Debug Tools</p>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDataSource}
            className="text-xs w-full"
          >
            {useTestData ? "Use Real Data" : "Use Test Data"}
          </Button>
          <p>ASIN: {asin}</p>
        </div>
      )}
    </div>
  );
};

export default VotingSidebar;
