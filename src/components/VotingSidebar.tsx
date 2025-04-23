
import VotingProgress from "./VotingProgress";
import { Button } from "@/components/ui/button";
import PromptEditor from "./PromptEditor";

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
}: VotingSidebarProps) => (
  <div className="space-y-4">
    {isEditingPrompt && (
      <PromptEditor
        asin={asin}
        promptText={promptText}
        onPromptSaved={() => {
          setIsEditingPrompt(false);
          if (onPromptSaved) onPromptSaved();
        }}
      />
    )}
    <Button
      variant={useTestData ? "default" : "outline"}
      onClick={toggleDataSource}
      className={useTestData ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-50"}
    >
      {useTestData ? "Using Test Data" : "Use Test Data"}
    </Button>
    <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImagesCount} />
  </div>
);

export default VotingSidebar;
