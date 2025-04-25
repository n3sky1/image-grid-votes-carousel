
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
      setLoading(true);
      setError(null);
      
      console.log("Index: fetchNextAsin called", currentAsin ? `with current ASIN: ${currentAsin}` : "for initial load");
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log("Index: No authenticated user found");
        setLoading(false);
        return;
      }

      const { data: completedVotings } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", user.data.user.id);
      
      const completedAsins = completedVotings ? completedVotings.map(cv => cv.asin) : [];
      if (currentAsin && !completedAsins.includes(currentAsin)) {
        console.log(`Index: Adding current ASIN ${currentAsin} to completed list`);
        completedAsins.push(currentAsin);
      }

      console.log("Index: Fetching next ASIN, excluding:", completedAsins);

      // Get all tshirts ready for voting
      const { data: allReadyTshirts, error: countError } = await supabase
        .from("tshirts")
        .select("asin")
        .eq("ready_for_voting", true);
        
      if (countError) {
        console.error("Index: Error fetching all ready tshirts:", countError);
      } else {
        console.log(`Index: Found ${allReadyTshirts?.length || 0} total tshirts ready for voting`);
      }

      // Build the query to fetch the next available t-shirt for voting
      let query = supabase
        .from("tshirts")
        .select("asin, ai_suggested_tags")
        .eq("ready_for_voting", true)
        .order('created_at', { ascending: true });  // Add consistent ordering
      
      if (completedAsins.length > 0) {
        // Use the "not.in" filter for the array of ASINs
        query = query.not('asin', 'in', completedAsins);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error) {
        console.error("Index: Error fetching ASIN:", error);
        setError("Unable to load t-shirt data. Please try again later.");
        setLoading(false);
        return;
      }
      
      if (data && data.asin) {
        console.log("Index: Found next t-shirt for voting:", data.asin);
        setAsin(data.asin);
        setSuggestedTags(data.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
        setError(null); // Clear any previous errors when we successfully find a shirt
      } else {
        console.log("Index: No more t-shirts available for voting");
        toast("All done!", {
          description: "You've completed voting on all available t-shirts.",
          position: "bottom-right"
        });
        setError("No more t-shirts available for voting");
        setAsin(""); // Clear the ASIN when no more are available
      }
    } catch (err) {
      console.error("Index: Unexpected error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Add event listener for vote completion events
  useEffect(() => {
    const handleVoteCompleted = (event: CustomEvent) => {
      console.log("Index: Vote completed event received", event.detail);
      const completedAsin = event.detail?.asin;
      fetchNextAsin(completedAsin);
    };

    // Add event listener with type assertion
    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    
    // Initial fetch
    fetchNextAsin();
    
    // Cleanup
    return () => {
      window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
    };
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
              // Clear the current ASIN to prevent showing the completion screen
              setAsin("");
              // Set loading to true to show loading indicator
              setLoading(true);
              // Fetch the next ASIN
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
