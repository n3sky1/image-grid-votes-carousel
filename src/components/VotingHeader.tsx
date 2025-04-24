
import React from "react";

interface VotingHeaderProps {
  votedCount: number;
  totalCount: number;
}

const VotingHeader = ({ votedCount, totalCount }: VotingHeaderProps) => {
  return (
    <div className="w-full p-4 bg-white border-b text-center">
      <h2 className="text-lg font-medium">
        Design {votedCount} of {totalCount} to Review
      </h2>
    </div>
  );
};

export default VotingHeader;
