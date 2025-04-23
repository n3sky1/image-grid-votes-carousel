
import { AlertOctagon, ImageOff, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface VotingErrorProps {
  error: string;
  onRetry?: () => void;
}

const VotingError = ({ error, onRetry }: VotingErrorProps) => {
  // Check if the error is specifically about images not loading
  const isImageLoadingError = error.includes("image") || error.includes("loading");
  const isReadyForVotingError = error.includes("not ready for voting");

  return (
    <Alert 
      variant="destructive" 
      className="flex flex-col items-center justify-center min-h-[350px] w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      {isImageLoadingError ? (
        <ImageOff size={48} className="text-red-500 mb-4" />
      ) : (
        <AlertOctagon size={48} className="text-red-500 mb-4" />
      )}
      <AlertTitle className="font-bold text-xl text-red-700 mb-2">
        {isImageLoadingError ? "Image Loading Error" : "Error Loading Content"}
      </AlertTitle>
      <AlertDescription className="text-red-600">{error}</AlertDescription>
      <div className="text-gray-600 mt-4 text-sm max-w-md">
        {isImageLoadingError ? (
          <p>
            There was a problem loading images from the server. This could be due to temporary 
            network issues or the images may be processing. Please try again in a few moments.
          </p>
        ) : isReadyForVotingError ? (
          <p>
            This t-shirt is not ready for voting yet. It may still be in processing or was 
            flagged for review.
          </p>
        ) : (
          <p>
            This may be because the t-shirt is not ready for voting or due to a system error.
          </p>
        )}
      </div>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw size={16} /> Try Again
        </Button>
      )}
    </Alert>
  );
};

export default VotingError;
