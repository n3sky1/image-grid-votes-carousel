
import { useState } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { sampleImages } from "@/data/sampleImages";

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB]">
      <header className="bg-white/70 shadow-md py-7 px-6 mb-10 rounded-b-xl border-b border-gray-200 
        bg-gradient-to-br from-[#e2d1c3] to-[#ede8f6] backdrop-blur-lg
      ">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight font-playfair drop-shadow-sm bg-gradient-to-r from-purple-600 via-blue-600 to-yellow-400 inline-block text-transparent bg-clip-text">
              Staff Design Voting
            </h1>
            <p className="text-lg mt-1 text-gray-600">Compare and vote on t-shirt options</p>
          </div>
          {/* You can add a logo or fun icon here for more branding/customization if you wish */}
        </div>
      </header>

      {/* Voting grid sits here. It's already styled and encapsulated. */}
      <main>
        <ImageVotingGrid initialImages={sampleImages} />
      </main>

      <footer className="mt-14 py-7 border-t bg-white/60 bg-gradient-to-bl from-[#ede8f6] to-[#fff8] 
        shadow-inner rounded-t-2xl
      ">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gray-500 text-sm text-center">
            Staff Image Voting System © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
