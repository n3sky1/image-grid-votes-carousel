import { ImageVotingGridProps } from "@/types/props";
import { useImageVoting } from "@/hooks/useImageVoting";
import VotingCompleted from "./VotingCompleted";
import VotingProgress from "./VotingProgress";
import VotingError from "./VotingError";
import VotingLoading from "./VotingLoading";
import { Card } from "@/components/ui/card";
import OriginalImageSection from "./OriginalImageSection";
import ConceptImagesGrid from "./ConceptImagesGrid";
import { toast } from "@/components/ui/sonner";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

interface ExtendedImageVotingGridProps extends ImageVotingGridProps {
  suggestedTags?: string[];
}

const ImageVotingGrid = ({ asin, suggestedTags = [] }: ExtendedImageVotingGridProps) => {
  const {
    originalImage,
    conceptImages,
    votedImages,
    setVotedImages,
    allVoted,
    loading,
    error,
    promptText,
    useTestData,
    toggleDataSource,
  } = useImageVoting(asin);

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editPromptValue, setEditPromptValue] = useState(promptText);
  const [saveLoading, setSaveLoading] = useState(false);

  if (!isEditingPrompt && editPromptValue !== promptText) {
    setEditPromptValue(promptText);
  }

  const handleVote = (id: string, vote: "like" | "dislike" | "love") => {
    setVotedImages((prev) => ({
      ...prev,
      [id]: vote,
    }));
  };

  const handleOriginalAction = (action: "copyrighted" | "no-design" | "cant-design") => {
    const actionMessages = {
      copyrighted: "Marked as Copyrighted!",
      "no-design": "Marked as No Design!",
      "cant-design": "Marked as Can't Design!",
    };

    toast(actionMessages[action], {
      description: `You selected: ${actionMessages[action].replace("Marked as ", "")}`,
      position: "bottom-right",
    });
  };

  const handleEditPrompt = () => {
    setIsEditingPrompt(true);
  };

  const handleSavePrompt = async () => {
    setSaveLoading(true);
    const { error: updateError } = await supabase
      .from("tshirts")
      .update({ ai_image_description: editPromptValue })
      .eq("asin", asin);

    if (updateError) {
      toast("Error saving prompt", { description: updateError.message, position: "bottom-right" });
    } else {
      toast("Updated prompt", { description: "Prompt updated successfully!", position: "bottom-right" });
      setIsEditingPrompt(false);
      window.location.reload();
    }
    setSaveLoading(false);
  };

  const handleCancelEditPrompt = () => {
    setIsEditingPrompt(false);
    setEditPromptValue(promptText);
  };

  if (loading) return <VotingLoading />;
  if (error) return <VotingError error={error} />;
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  const tagsToUse = suggestedTags.length > 0 ? suggestedTags : ["Funny", "Vintage", "Graphic", "Summer"];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="p-4 space-y-8">
        <Card className="overflow-hidden shadow-lg border-0">
          <div className="p-6">
            <div className="flex flex-col md:flex-row w-full">
              <div className="md:w-1/2 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="p-6">
                  <OriginalImageSection
                    originalImage={originalImage}
                    promptText={promptText}
                    onOriginalAction={handleOriginalAction}
                    onEditPrompt={handleEditPrompt}
                    onToggleDataSource={toggleDataSource}
                    useTestData={useTestData}
                  />
                </div>
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="p-6 space-y-6">
                  <div className="bg-white/80 rounded-lg p-5 shadow-sm border border-blue-100 relative group">
                    <div className="text-base font-bold mb-2 text-gray-800 flex justify-between items-center">
                      <span>Generation Prompt</span>
                      {!isEditingPrompt && (
                        <button
                          onClick={handleEditPrompt}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                          aria-label="Edit prompt"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    <div className="text-gray-700 max-h-[150px] overflow-y-auto text-sm">
                      {!isEditingPrompt ? (
                        promptText
                      ) : (
                        <div>
                          <Textarea
                            value={editPromptValue}
                            onChange={(e) => setEditPromptValue(e.target.value)}
                            className="mb-2"
                            disabled={saveLoading}
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 flex gap-2 items-center"
                                    onClick={handleSavePrompt}
                                    disabled={saveLoading}
                                    aria-label="Save and regenerate"
                                  >
                                    <Save className="h-4 w-4" />
                                    {saveLoading ? "Saving..." : "Save & Regenerate"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Save and regenerate
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1"
                                    onClick={handleCancelEditPrompt}
                                    disabled={saveLoading}
                                    aria-label="Cancel editing"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Cancel editing
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImages.length} />

                  <Button
                    variant={useTestData ? "default" : "outline"}
                    onClick={toggleDataSource}
                    className={useTestData ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-50"}
                  >
                    {useTestData ? "Using Test Data" : "Use Test Data"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <ConceptImagesGrid
          conceptImages={conceptImages}
          votedImages={votedImages}
          onVote={handleVote}
          originalImage={originalImage}
        />
      </div>
    </div>
  );
};

export default ImageVotingGrid;
