
import VotingProgress from "./VotingProgress";
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
  promptText,
  asin,
  onPromptSaved,
  isEditingPrompt,
  setIsEditingPrompt,
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
    <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImagesCount} />
  </div>
);

export default VotingSidebar;

