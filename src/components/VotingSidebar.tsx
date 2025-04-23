
import VotingProgress from "./VotingProgress";
import PromptEditor from "./PromptEditor";
// import TagVoting from "./TagVoting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VotingSidebarProps {
  votedImages: Record<string, "like" | "dislike" | "love">;
  conceptImagesCount: number;
  useTestData: boolean;
  toggleDataSource: () => void;
  promptText: string;
  asin: string;
  onPromptSaved?: () => void;
  isEditingPrompt: boolean;
  setIsEditingPrompt: (value: boolean) => void;
  aiRecommendedModel: string;
  // suggestedTags?: string[]; // removed since tags are gone
}

const VotingSidebar = ({
  votedImages,
  conceptImagesCount,
  promptText,
  asin,
  onPromptSaved,
  isEditingPrompt,
  setIsEditingPrompt,
  aiRecommendedModel,
}: VotingSidebarProps) => (
  <div className="space-y-4">
    <div>
      <PromptEditor
        asin={asin}
        promptText={promptText}
        onPromptSaved={() => {
          setIsEditingPrompt(false);
          if (onPromptSaved) onPromptSaved();
        }}
      />
    </div>

    <div className="flex flex-col gap-2 bg-white/70 border border-blue-100 rounded-lg p-4 mb-2">
      <div>
        <Label htmlFor="ai-rec-model" className="block mb-1 text-gray-700 font-medium">Used:</Label>
        <Input
          id="ai-rec-model"
          type="text"
          value={aiRecommendedModel || ""}
          readOnly
          className="bg-gray-100 cursor-not-allowed border-gray-200"
        />
      </div>
      <div>
        <Label htmlFor="tshirt-asin" className="block mb-1 text-gray-700 font-medium">ASIN:</Label>
        <Input
          id="tshirt-asin"
          type="text"
          value={asin}
          readOnly
          className="bg-gray-100 cursor-not-allowed border-gray-200"
        />
      </div>
    </div>

    <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImagesCount} />
  </div>
);

export default VotingSidebar;
