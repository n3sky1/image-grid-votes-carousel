
import { AlertOctagon } from "lucide-react";

interface VotingErrorProps {
  error: string;
}

const VotingError = ({ error }: VotingErrorProps) => (
  <div className="flex flex-col items-center justify-center min-h-[350px] w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <AlertOctagon size={48} className="text-red-500 mb-4" />
    <h3 className="font-bold text-xl text-red-700 mb-2">Error Loading Content</h3>
    <p className="text-red-600">{error}</p>
    <p className="text-gray-600 mt-4 text-sm">
      This may be because the t-shirt is not ready for voting or due to a system error.
    </p>
  </div>
);

export default VotingError;
