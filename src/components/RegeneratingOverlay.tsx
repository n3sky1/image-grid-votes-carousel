
import { useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const RegeneratingOverlay = ({ onDismiss }: { onDismiss?: () => void }) => {
  const [seconds, setSeconds] = useState(60);
  const [shouldShow, setShouldShow] = useState(true);
  
  useEffect(() => {
    console.log("RegeneratingOverlay mounted with timer starting at", seconds, "seconds");
    
    // Start a countdown timer from 60 seconds
    if (seconds <= 0) {
      setShouldShow(false);
      if (onDismiss) {
        console.log("Timer reached zero, calling onDismiss callback");
        onDismiss();
      }
      return;
    }
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Don't hide immediately, give a small delay
          setTimeout(() => {
            setShouldShow(false);
            if (onDismiss) {
              console.log("Timer reached zero with delay, calling onDismiss callback");
              onDismiss();
            }
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Safety timeout: force hide after maximum 90 seconds (60 + 30 extra)
    // This is a fallback in case the backend doesn't send the regenerate=false event
    const safetyTimeout = setTimeout(() => {
      console.log("RegeneratingOverlay safety timeout reached, force hiding and calling onDismiss");
      setShouldShow(false);
      if (onDismiss) {
        onDismiss();
      }
      toast.info("Continuing automatically", {
        description: "The regeneration process may still be running in the background."
      });
    }, 90000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(safetyTimeout);
      console.log("RegeneratingOverlay unmounting, cleanup complete");
    };
  }, [seconds, onDismiss]);
  
  // When the overlay is unmounted and shown again, reset the timer
  useEffect(() => {
    setSeconds(60);
  }, []);
  
  if (!shouldShow) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-blue-500 animate-pulse" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Images regenerating</h3>
            <p className="text-gray-600">
              Please wait. It should take approximately {seconds > 0 ? seconds : "a few more"} seconds.
            </p>
            <div className="flex items-center justify-center mt-4 text-blue-500">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">Images will load when ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegeneratingOverlay;
