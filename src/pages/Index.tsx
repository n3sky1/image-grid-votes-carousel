
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNextAsin = async (currentAsin?: string) => {
    try {
      console.log("Fetching next ASIN, current:", currentAsin);
      setLoading(true);
      setError(null);
      
      // Always reset noMoreTshirts when starting a fetch
      setNoMoreTshirts(false);
      
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
      console.log("Completed ASINs:", completedAsins);
      
      // If we have a current ASIN that hasn't been marked as completed, add it to our list
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
      
      // If there are no t-shirts at all
      if (!totalCount || totalCount === 0) {
        console.log("No t-shirts available at all");
        setNoMoreTshirts(true);
        setLoading(false);
        setIsInitializing(false);
        toast("No t-shirts available", {
          description: "There are no t-shirts available for voting at this time.",
          position: "bottom-right"
        });
        return;
      }
      
      // Debug the completed vs total numbers
      console.log(`User has completed ${completedAsins.length} out of ${totalCount} total t-shirts`);
      
      // If the user has completed all available t-shirts
      if (completedAsins.length >= totalCount) {
        console.log("User has completed all available t-shirts");
        setNoMoreTshirts(true);
        setLoading(false);
        setIsInitializing(false);
        toast("All done!", {
          description: "You've completed voting on all available t-shirts.",
          position: "bottom-right"
        });
        return;
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
        setNoMoreTshirts(false); // Make sure this is explicitly set to false
      } else {
        console.log("Query returned no t-shirts despite count check showing some available");
        console.log("This is unexpected - rechecking with a different query approach");
        
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
          setNoMoreTshirts(false);
        } else {
          // If even the fallback fails, show the "All Done" message
          console.log("Even fallback query found no t-shirts - setting noMoreTshirts to true");
          setNoMoreTshirts(true);
          toast("All done!", {
            description: "You've completed voting on all available t-shirts.",
            position: "bottom-right"
          });
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
      setNoMoreTshirts(false);
      setLoading(true);
      
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
      noMoreTshirts,
      userId 
    });
  }, [asin, loading, isInitializing, noMoreTshirts, userId]);

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

  // Only show noMoreTshirts view if we've confirmed there are no more t-shirts
  // AND we're not in the initial loading state
  if (noMoreTshirts && !isInitializing) {
    console.log("Rendering 'All Done' view");
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

  console.log("Rendering main view with state:", { 
    loading, 
    isInitializing, 
    asin, 
    noMoreTshirts 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB]">
      <main>
        {loading || isInitializing ? (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Looking for t-shirts to vote on...</p>
            </div>
          </div>
        ) : asin ? (
          <ImageVotingGrid 
            asin={asin} 
            suggestedTags={suggestedTags} 
            onVotingCompleted={() => fetchNextAsin(asin)}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[350px] text-gray-500 text-xl w-full">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Looking for t-shirts to vote on...</p>
            </div>
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
