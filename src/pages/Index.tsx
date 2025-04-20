import { useState } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { sampleImages } from "@/data/sampleImages";
const Index = () => {
  const [showInstructions, setShowInstructions] = useState(true);
  return <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Design Voting</h1>
            <p className="text-gray-600">Compare and vote on t-shirt options</p>
          </div>
          <button onClick={() => setShowInstructions(prev => !prev)} className="text-sm text-blue-600 hover:underline">
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
        </div>
      </header>
      
      {showInstructions && <div className="max-w-6xl mx-auto px-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            <h2 className="font-medium mb-2">How it works:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Compare each image to the original reference image</li>
              <li>Vote using the buttons below each image:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><span className="font-medium">Thumbs Up</span> - Like the image</li>
                  <li><span className="font-medium">Thumbs Down</span> - Dislike the image</li>
                  <li><span className="font-medium">Heart</span> - Love the image</li>
                </ul>
              </li>
              <li>After voting, the image will be removed and the next one will be shown</li>
              <li>Continue until you've voted on all images</li>
            </ol>
          </div>
        </div>}
      
      <main>
        <ImageVotingGrid initialImages={sampleImages} />
      </main>
      
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gray-500 text-sm text-center">
            Staff Image Voting System © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;