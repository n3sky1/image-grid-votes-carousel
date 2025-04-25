
import { useState, useEffect } from "react";
import ImageVotingGrid from "@/components/ImageVotingGrid";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [asin, setAsin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [noMoreTshirts, setNoMoreTshirts] = useState(false);
  
  const fetchNextAsin = async (currentAsin?: string) => {
    try {
      console.log("🔍 Starting fetchNextAsin", { currentAsin });
      setLoading(true);
      setError(null);
      setNoMoreTshirts(false);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("🚨 No authenticated user found", userError);
        setLoading(false);
        setError("Authentication required. Please log in.");
        return;
      }

      const userId = userData.user.id;

      // Fetch user's completed votings
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

      // Create a Set of completed ASINs for efficient lookup
      const completedAsins = new Set(completedVotings?.map(cv => cv.asin) || []);
      
      // Add current ASIN to completed set if provided
      if (currentAsin) {
        console.log(`🔢 Adding current ASIN ${currentAsin} to completed list`);
        completedAsins.add(currentAsin);
      }

      console.log(`🔢 Total completed ASINs: ${completedAsins.size}`);
      
      // Fetch ALL ready t-shirts
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
      
      // Create an array of t-shirts that haven't been completed
      const availableTshirts = allReadyTshirts?.filter(
        tshirt => !completedAsins.has(tshirt.asin)
      ) || [];
      
      console.log(`🎯 Available t-shirts after filtering: ${availableTshirts.length}`);
      console.log("Available ASINs:", availableTshirts.map(t => t.asin));

      if (availableTshirts.length > 0) {
        // Pick the first available t-shirt
        const nextTshirt = availableTshirts[0];
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
        setAsin(""); // Clear the ASIN
        setNoMoreTshirts(true);
      }
    } catch (err) {
      console.error("🚨 Unexpected error in fetchNextAsin:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const resetCompletedVotings = async () => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { error } = await supabase
        .from("completed_votings")
        .delete()
        .eq("user_id", userData.user.id);
        
      if (error) {
        console.error("Error resetting completed votings:", error);
        toast.error("Failed to reset completed votings");
      } else {
        toast.success("Successfully reset your voting progress");
        fetchNextAsin();
      }
    } catch (err) {
      console.error("Error in resetCompletedVotings:", err);
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
          
          {noMoreTshirts && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                You have reviewed all available t-shirts. If you'd like to review them again, you can reset your progress.
              </p>
              <Button 
                onClick={resetCompletedVotings}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Reset Your Progress
              </Button>
            </div>
          )}
          
          <Button 
            onClick={() => fetchNextAsin()}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </Button>
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
