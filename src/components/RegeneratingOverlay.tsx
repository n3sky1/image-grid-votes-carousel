
import { AlertCircle, Clock } from "lucide-react";

const RegeneratingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-blue-500 animate-pulse" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Images regenerating</h3>
            <p className="text-gray-600">
              Please wait. It should take approximately 60 seconds.
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
