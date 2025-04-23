
import { AlertCircle } from "lucide-react";

const WinningVoteOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-green-500 animate-pulse" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Winning vote cast!</h3>
            <p className="text-gray-600">
              Loading next t-shirt for review...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinningVoteOverlay;
