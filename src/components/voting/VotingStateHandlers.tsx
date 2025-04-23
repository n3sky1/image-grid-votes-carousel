
import VotingError from "../VotingError";
import VotingLoading from "../VotingLoading";
import { VotingLayout } from "./VotingLayout";

interface VotingStateHandlersProps {
  loading: boolean;
  error: string | null;
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  showRegeneratingOverlay: boolean;
  asin: string;
  onVotingCompleted?: () => void;
  onRetry: () => void;
  children: React.ReactNode;
}

export const VotingStateHandlers = ({
  loading,
  error,
  votedImages,
  showRegeneratingOverlay,
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

  return (
    <VotingLayout
      showRegeneratingOverlay={showRegeneratingOverlay}
      asin={asin}
      onVotingCompleted={onVotingCompleted}
    >
      {children}
    </VotingLayout>
  );
};
