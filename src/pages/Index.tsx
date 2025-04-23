
import { useState, useEffect } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const DEMO_ASIN = "B01N4HS7B8";

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [asin, setAsin] = useState(DEMO_ASIN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchFirstAsin = async () => {
      try {
        const { data, error } = await supabase
          .from("tshirts")
          .select("asin, ai_suggested_tags, ready_for_voting")
          .eq("ready_for_voting", true) // Only get t-shirts ready for voting
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching ASIN:", error);
          setError("Unable to load t-shirt data. Please try again later.");
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
        } else {
          toast("Using demo data", {
            description: "No t-shirts ready for voting were found. Using demo data instead.",
            position: "bottom-right"
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFirstAsin();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="text-red-500 w-10 h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center text-red-700 mb-2">Error</h1>
          <p className="text-center text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
