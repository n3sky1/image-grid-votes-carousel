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

  const fetchNextAsin = async (currentAsin?: string) => {
    try {
      console.log("🔍 Starting fetchNextAsin", { currentAsin });
      setLoading(true);
      setError(null);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("🚨 No authenticated user found", userError);
        setLoading(false);
        setError("Authentication required. Please log in.");
        return;
      }

      const userId = userData.user.id;

      // Detailed logging of completed votings
      const { data: completedVotings, error: votingsError } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", userId);
      
      if (votingsError) {
        console.error("🚨 Error fetching completed votings", votingsError);
        setError("Failed to load voting data. Please try again later.");
        setLoading(false);
        return;
      }

      const completedAsins = completedVotings ? completedVotings.map(cv => cv.asin) : [];
      
      // Add current ASIN to completed list if not already there
      if (currentAsin && !completedAsins.includes(currentAsin)) {
        console.log(`🔢 Adding current ASIN ${currentAsin} to completed list`);
        completedAsins.push(currentAsin);
      }

      console.log(`🔢 Total completed ASINs: ${completedAsins.length}`);
      console.log(`📋 Completed ASINs: `, completedAsins);
      
      // Fetch ALL ready t-shirts with more comprehensive logging
      const { data: allReadyTshirts, error: readyError } = await supabase
        .from("tshirts")
        .select("asin, ai_suggested_tags, ready_for_voting")
        .eq("ready_for_voting", true);
        
      if (readyError) {
        console.error("🚨 Error fetching all ready tshirts", readyError);
        setError("Failed to load t-shirt data. Please try again later.");
        setLoading(false);
        return;
      }

      console.log(`📦 Total ready t-shirts: ${allReadyTshirts?.length || 0}`);
      
      // Log all ready ASINs for debugging
      if (allReadyTshirts) {
        console.log("🔢 All Ready ASINs:", allReadyTshirts.map(t => t.asin));
      }

      // Filter out completed ASINs
      const availableTshirts = allReadyTshirts?.filter(
        tshirt => !completedAsins.includes(tshirt.asin)
      );
      
      console.log(`🎯 Available t-shirts after filtering: ${availableTshirts?.length || 0}`);

      const nextTshirt = availableTshirts && availableTshirts.length > 0 
        ? availableTshirts[0] 
        : null;
      
      if (nextTshirt) {
        console.log("✅ Found next t-shirt for voting:", nextTshirt.asin);
        setAsin(nextTshirt.asin);
        setSuggestedTags(nextTshirt.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
        setError(null);
      } else {
        console.warn("🚫 No more t-shirts available for voting");
        toast("All done!", {
          description: "You've completed voting on all available t-shirts.",
          position: "bottom-right"
        });
        setError("You've completed voting on all available t-shirts.");
        setAsin(""); // Clear the ASIN when no more are available
      }
    } catch (err) {
      console.error("🚨 Unexpected error in fetchNextAsin:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleVoteCompleted = (event: CustomEvent) => {
      console.log("Index: Vote completed event received", event.detail);
      const completedAsin = event.detail?.asin;
      fetchNextAsin(completedAsin);
    };

    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    
    fetchNextAsin();
    
    return () => {
      window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="text-red-500 w-10 h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center text-red-700 mb-2">Notice</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB]">
      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            Loading...
          </div>
        ) : (
          <ImageVotingGrid 
            asin={asin} 
            suggestedTags={suggestedTags} 
            onVotingCompleted={() => {
              console.log("Index: Voting completed for ASIN:", asin);
              setAsin("");
              setLoading(true);
              fetchNextAsin(asin);
            }}
          />
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
