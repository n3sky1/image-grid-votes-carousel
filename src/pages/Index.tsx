
import { useState, useEffect } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [asin, setAsin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [noMoreTshirts, setNoMoreTshirts] = useState(false);

  const fetchNextAsin = async (currentAsin?: string) => {
    try {
      setLoading(true);
      setError(null);
      setNoMoreTshirts(false);
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const { data: completedVotings } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", user.data.user.id);
      
      const completedAsins = completedVotings ? completedVotings.map(cv => cv.asin) : [];
      if (currentAsin && !completedAsins.includes(currentAsin)) {
        completedAsins.push(currentAsin);
      }

      // Build the query to fetch the next available t-shirt for voting
      let query = supabase
        .from("tshirts")
        .select("asin, ai_suggested_tags")
        .eq("ready_for_voting", true);
      
      if (completedAsins.length > 0) {
        // Use the "not.eq" filter for each ASIN in the array
        // This is more reliable than "not.in" which was causing issues
        for (const completedAsin of completedAsins) {
          query = query.not('asin', 'eq', completedAsin);
        }
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error) {
        console.error("Error fetching ASIN:", error);
        setError("Unable to load t-shirt data. Please try again later.");
        setLoading(false);
        return;
      }
      
      if (data && data.asin) {
        console.log("Found next t-shirt for voting:", data.asin);
        setAsin(data.asin);
        setSuggestedTags(data.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
        setNoMoreTshirts(false);
      } else {
        console.log("No more t-shirts available for voting");
        toast("All done!", {
          description: "You've completed voting on all available t-shirts.",
          position: "bottom-right"
        });
        setNoMoreTshirts(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextAsin();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="text-red-500 w-10 h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center text-red-700 mb-2">Error</h1>
          <p className="text-center text-gray-700">{error}</p>
          <button 
            onClick={() => fetchNextAsin()}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (noMoreTshirts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">All Done!</h2>
          <p className="text-lg text-gray-600 mb-6">
            You've completed voting on all available t-shirts.
          </p>
          <button 
            onClick={() => fetchNextAsin()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Check for New T-shirts
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
        ) : asin ? (
          <ImageVotingGrid 
            asin={asin} 
            suggestedTags={suggestedTags} 
            onVotingCompleted={() => fetchNextAsin(asin)}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            No t-shirts available for voting.
          </div>
        )}
      </main>

      <footer className="mt-14 py-7 border-t bg-white/60 bg-gradient-to-bl from-[#ede8f6] to-[#fff8] 
        shadow-inner rounded-t-2xl">
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
