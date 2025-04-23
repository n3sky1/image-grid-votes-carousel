
import VotingProgress from "./VotingProgress";
import PromptEditor from "./PromptEditor";
import TagVoting from "./TagVoting";

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
  suggestedTags?: string[];
}

const VotingSidebar = ({
  votedImages,
  conceptImagesCount,
  promptText,
  asin,
  onPromptSaved,
  isEditingPrompt,
  setIsEditingPrompt,
  suggestedTags = [],
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

    {/* Tags are now under Generation Prompt but above Voting Progress */}
    {suggestedTags.length > 0 && (
      <TagVoting asin={asin} suggestedTags={suggestedTags} />
    )}

    <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImagesCount} />
  </div>
);

export default VotingSidebar;
