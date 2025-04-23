
import { AlertOctagon, ImageOff } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface VotingErrorProps {
  error: string;
}

const VotingError = ({ error }: VotingErrorProps) => {
  // Check if the error is specifically about images not loading
  const isImageLoadingError = error.includes("image") || error.includes("loading");

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
      <div className="text-gray-600 mt-4 text-sm">
        {isImageLoadingError ? (
          <p>
            There was a problem loading images from the server. This could be due to network issues, 
            CORS restrictions, or the images may no longer be available.
          </p>
        ) : (
          <p>
            This may be because the t-shirt is not ready for voting or due to a system error.
          </p>
        )}
      </div>
    </Alert>
  );
};

export default VotingError;
