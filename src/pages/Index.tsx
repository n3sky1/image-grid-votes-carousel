
import { useState, useEffect } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { supabase } from "@/integrations/supabase/client";

const DEMO_ASIN = "B01N4HS7B8";

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [asin, setAsin] = useState(DEMO_ASIN);
  const [loading, setLoading] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchFirstAsin = async () => {
      try {
        const { data, error } = await supabase
          .from("tshirts")
          .select("asin, ai_suggested_tags")
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching ASIN:", error);
          return;
        }
        
        if (data && data.asin) {
          setAsin(data.asin);
          
          // Set the suggested tags if they exist in data
          if (data.ai_suggested_tags && Array.isArray(data.ai_suggested_tags)) {
            setSuggestedTags(data.ai_suggested_tags);
          } else {
            // Default tags if none exist in the database
            setSuggestedTags(["Funny", "Vintage", "Graphic", "Summer"]);
          }
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
      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            Loading...
          </div>
        ) : (
          <ImageVotingGrid asin={asin} suggestedTags={suggestedTags} />
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
