
import { useState, useEffect } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { supabase } from "@/integrations/supabase/client";

const DEMO_ASIN = "B01N4HS7B8"; // Fallback ASIN if we can't fetch one

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [asin, setAsin] = useState(DEMO_ASIN);
  const [loading, setLoading] = useState(true);

  // Try to get an ASIN from the database
  useEffect(() => {
    const fetchFirstAsin = async () => {
      try {
        const { data, error } = await supabase
          .from("tshirts")
          .select("asin")
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching ASIN:", error);
          return; // Keep using the default ASIN
        }
        
        if (data && data.asin) {
          setAsin(data.asin);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFirstAsin();
  }, []);

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
        </div>
      </header>

      {/* Voting grid sits here. Now pulls by ASIN */}
      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            Loading...
          </div>
        ) : (
          <ImageVotingGrid asin={asin} />
        )}
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
