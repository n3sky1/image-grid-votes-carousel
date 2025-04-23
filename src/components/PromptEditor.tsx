import { useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface PromptEditorProps {
  asin: string;
  promptText: string;
  onPromptSaved?: (newPrompt: string) => void;
}

const PromptEditor = ({ asin, promptText, onPromptSaved }: PromptEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(promptText);
  const [saveLoading, setSaveLoading] = useState(false);

  // Update local value if props change
  if (!isEditing && editValue !== promptText) {
    setEditValue(promptText);
  }

  const handleSavePrompt = async () => {
    setSaveLoading(true);

    // Explicitly set regenerate to true and update prompt
    const { error: updateError } = await supabase
      .from("tshirts")
      .update({ 
        ai_image_description: editValue, 
        regenerate: true  // Explicitly set regenerate to true
      })
      .eq("asin", asin);

    if (updateError) {
      toast("Error saving prompt", { description: updateError.message, position: "bottom-right" });
    } else {
      toast("Updated prompt", { description: "Prompt updated and regeneration started!", position: "bottom-right" });
      setIsEditing(false);
      if (onPromptSaved) onPromptSaved(editValue);
      // Do not reload — let polling mechanism in voting grid pick up new images
    }
    setSaveLoading(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(promptText);
  };

  return (
    <div className="bg-white/80 rounded-lg p-5 shadow-sm border border-blue-100 relative group">
      <div className="text-base font-bold mb-2 text-gray-800 flex justify-between items-center">
        <span>Generation Prompt</span>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            aria-label="Edit prompt"
          >
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
      <div className="text-gray-700 max-h-[200px] overflow-y-auto text-sm">
        {!isEditing ? (
          promptText
        ) : (
          <div>
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="mb-2"
              disabled={saveLoading}
              rows={6} // Increased from 4 to 6 to make it 25% larger
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
                      onClick={handleCancelEdit}
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
  );
};

export default PromptEditor;
