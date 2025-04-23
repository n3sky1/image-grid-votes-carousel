
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchNextAsin = async (currentAsin?: string) => {
    try {
      console.log("Fetching next ASIN, current:", currentAsin);
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        setError("Authentication error. Please try logging in again.");
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      if (!userData.user) {
        console.log("No authenticated user found");
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      // Store user ID for debugging
      const currentUserId = userData.user.id;
      setUserId(currentUserId);
      console.log("Current user ID:", currentUserId);

      // Get the list of ASINs the user has already voted on with explicit user_id filter
      const { data: completedVotings, error: completedError } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", currentUserId);
      
      if (completedError) {
        console.error("Error fetching completed votings:", completedError);
        setError("Failed to retrieve your voting history.");
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      const completedAsins = completedVotings ? completedVotings.map(cv => cv.asin) : [];
      console.log("User has completed", completedAsins.length, "t-shirts");
      
      // If we have a current ASIN that hasn't been marked as completed, add it to our list
      // But make sure it's not already in the list
      if (currentAsin && !completedAsins.includes(currentAsin)) {
        completedAsins.push(currentAsin);
      }

      // First check if there are any t-shirts available at all
      const { count: totalCount, error: countError } = await supabase
        .from("tshirts")
        .select("asin", { count: 'exact', head: true })
        .eq("ready_for_voting", true);
        
      if (countError) {
        console.error("Error fetching t-shirt count:", countError);
        setError("Unable to check available t-shirts.");
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      console.log("Total t-shirts available:", totalCount);
      setHasCheckedAvailability(true);
      
      // If there are no t-shirts at all, show a notification but continue trying
      if (!totalCount || totalCount === 0) {
        console.log("No t-shirts available for voting at the moment");
        toast("Limited availability", {
          description: "There are very few t-shirts available for voting. We'll keep trying.",
          position: "bottom-right"
        });
      }
      
      // Debug the completed vs total numbers
      if (totalCount) {
        console.log(`User has completed ${completedAsins.length} out of ${totalCount} total t-shirts`);
      }
      
      // Build the query to fetch the next available t-shirt for voting
      console.log("Finding next t-shirt not in:", completedAsins);
      let query = supabase
        .from("tshirts")
        .select("asin, ai_suggested_tags")
        .eq("ready_for_voting", true);
      
      // Only filter by completed ASINs if there are any
      if (completedAsins.length > 0) {
        query = query.not('asin', 'in', `(${completedAsins.join(',')})`);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error) {
        console.error("Error fetching ASIN:", error);
        setError("Unable to load t-shirt data. Please try again later.");
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      if (data && data.asin) {
        console.log("Found next t-shirt for voting:", data.asin);
        setAsin(data.asin);
        setSuggestedTags(data.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
        setRetryCount(0); // Reset retry counter on success
      } else {
        console.log("No more t-shirts available for voting, will retry");
        
        // Fallback query - try to get any t-shirt that's ready for voting
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("tshirts")
          .select("asin, ai_suggested_tags")
          .eq("ready_for_voting", true)
          .limit(1)
          .maybeSingle();
          
        if (fallbackData && fallbackData.asin) {
          console.log("Fallback query found t-shirt:", fallbackData.asin);
          setAsin(fallbackData.asin);
          setSuggestedTags(fallbackData.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
          setRetryCount(0); // Reset retry counter on success
        } else {
          console.log("No t-shirts available even with fallback query");
          setAsin("");
          
          // Increment retry count and schedule another attempt
          const nextRetryCount = retryCount + 1;
          setRetryCount(nextRetryCount);
          
          // Schedule a retry with exponential backoff (max 30 seconds)
          const delay = Math.min(Math.pow(1.5, nextRetryCount) * 1000, 30000);
          console.log(`Will retry in ${delay/1000} seconds (attempt ${nextRetryCount})`);
          
          setTimeout(() => {
            console.log(`Retrying fetch after ${delay/1000} second delay`);
            fetchNextAsin();
          }, delay);
          
          // Show a notification on every 3rd retry
          if (nextRetryCount % 3 === 0) {
            toast("Still searching", {
              description: "Looking for available t-shirts to vote on...",
              position: "bottom-right"
            });
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Reset everything at the start
      setIsInitializing(true);
      setAsin("");
      setLoading(true);
      setHasCheckedAvailability(false);
      setRetryCount(0);
      
      console.log("Initializing application...");
      await fetchNextAsin();
    };
    
    initializeApp();
  }, []);

  // Debug current state
  useEffect(() => {
    console.log("Current state:", { 
      asin, 
      loading, 
      isInitializing, 
      userId,
      hasCheckedAvailability,
      retryCount
    });
  }, [asin, loading, isInitializing, userId, hasCheckedAvailability, retryCount]);

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

  // Show loading state or the voting interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB]">
      <main>
        {(loading || isInitializing || !hasCheckedAvailability || !asin) ? (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Looking for t-shirts to vote on...</p>
              {!asin && !loading && hasCheckedAvailability && (
                <button 
                  onClick={() => fetchNextAsin()}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <ImageVotingGrid 
            asin={asin} 
            suggestedTags={suggestedTags} 
            onVotingCompleted={() => fetchNextAsin(asin)}
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
