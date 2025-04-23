
import VotingError from "../VotingError";
import VotingLoading from "../VotingLoading";
import VotingCompleted from "../VotingCompleted";
import { VotingLayout } from "./VotingLayout";

interface VotingStateHandlersProps {
  loading: boolean;
  error: string | null;
  allVoted: boolean;
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  showRegeneratingOverlay: boolean;
  showWinningVoteOverlay?: boolean;
  asin: string;
  onVotingCompleted?: () => void;
  onRetry: () => void;
  children: React.ReactNode;
}

export const VotingStateHandlers = ({
  loading,
  error,
  allVoted,
  votedImages,
  showRegeneratingOverlay,
  showWinningVoteOverlay = false,
  asin,
  onVotingCompleted,
  onRetry,
  children
}: VotingStateHandlersProps) => {
  if (loading) return <VotingLoading />;
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <VotingError error={error} onRetry={onRetry} />
      </div>
    );
  }
  if (allVoted) return <VotingCompleted votedImages={votedImages} />;

  return (
    <VotingLayout
      showRegeneratingOverlay={showRegeneratingOverlay}
      showWinningVoteOverlay={showWinningVoteOverlay}
      allVoted={allVoted}
      asin={asin}
      onVotingCompleted={onVotingCompleted}
    >
      {children}
    </VotingLayout>
  );
};
