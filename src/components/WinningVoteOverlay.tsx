
import { Heart } from "lucide-react";

const WinningVoteOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Heart className="h-16 w-16 text-red-500 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              +1
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Winning vote cast!</h3>
            <p className="text-gray-600">
              Loading the next t-shirt for review...
            </p>
            <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-progress" 
                   style={{animation: "progress 3s ease-in-out forwards"}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinningVoteOverlay;
