
import VotingError from "../VotingError";
import VotingLoading from "../VotingLoading";
import { VotingLayout } from "./VotingLayout";

interface VotingStateHandlersProps {
  loading: boolean;
  error: string | null;
  allVoted: boolean;
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  showRegeneratingOverlay: boolean;
  showWinningVoteOverlay: boolean;
  asin: string;
  onVotingCompleted?: () => void;
  onRegenerationCompleted?: () => void;
  onRetry: () => void;
  children: React.ReactNode;
}

export const VotingStateHandlers = ({
  loading,
  error,
  allVoted,
  votedImages,
  showRegeneratingOverlay,
  showWinningVoteOverlay,
  asin,
  onVotingCompleted,
  onRegenerationCompleted,
  onRetry,
  children
}: VotingStateHandlersProps) => {
  // Only show loading if we're loading AND not showing regenerating overlay
  // This prevents the "Loading designs..." message from appearing when we transition from
  // regeneration overlay back to the main view
  if (loading && !showRegeneratingOverlay) return <VotingLoading />;
  
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <VotingError error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <VotingLayout
      showRegeneratingOverlay={showRegeneratingOverlay}
      showWinningVoteOverlay={showWinningVoteOverlay}
      allVoted={allVoted}
      asin={asin}
      onVotingCompleted={onVotingCompleted}
      onRegenerationCompleted={onRegenerationCompleted}
    >
      {children}
    </VotingLayout>
  );
};
