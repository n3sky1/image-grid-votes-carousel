
import { ReactNode } from "react";
import RegeneratingOverlay from "../RegeneratingOverlay";
import VotingCompletionHandler from "../VotingCompletionHandler";

interface VotingLayoutProps {
  children: ReactNode;
  showRegeneratingOverlay: boolean;
  allVoted: boolean;
  asin: string;
  onVotingCompleted?: () => void;
}

export const VotingLayout = ({
  children,
  showRegeneratingOverlay,
  allVoted,
  asin,
  onVotingCompleted
}: VotingLayoutProps) => {
  return (
    <>
      <VotingCompletionHandler 
        allVoted={allVoted} 
        asin={asin} 
        onVotingCompleted={onVotingCompleted} 
      />
      {showRegeneratingOverlay && <RegeneratingOverlay />}
      <div className="w-full max-w-6xl mx-auto">
        <div className="p-4 space-y-8">
          {children}
        </div>
      </div>
    </>
  );
};
