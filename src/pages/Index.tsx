
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

      console.log("Completed ASINs:", completedAsins);

      console.log("Fetching next available t-shirt");

      // Check if there are ANY t-shirts ready for voting regardless of completion status
      const { count: totalReadyCount } = await supabase
        .from("tshirts")
        .select("*", { count: "exact", head: true })
        .eq("ready_for_voting", true);
        
      console.log("Total ready for voting t-shirts:", totalReadyCount);
      
      // If no t-shirts are ready at all, show appropriate message
      if (!totalReadyCount) {
        console.log("No t-shirts are ready for voting in the system");
        setError("No t-shirts are available for voting in the system.");
        setLoading(false);
        return;
      }
      
      // Build the query to fetch the next available t-shirt for voting
      let query = supabase
        .from("tshirts")
        .select("asin, ai_suggested_tags")
        .eq("ready_for_voting", true);
      
      // Only filter out completed ASINs if there are any
      if (completedAsins.length > 0) {
        query = query.not('asin', 'in', completedAsins);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error) {
        console.error("Error fetching ASIN:", error);
        setError("Unable to load t-shirt data. Please try again later.");
        setLoading(false);
        return;
      }
      
      console.log("Query result:", data);
      
      if (data && data.asin) {
        console.log("Found next t-shirt for voting:", data.asin);
        setAsin(data.asin);
        setSuggestedTags(data.ai_suggested_tags || ["Funny", "Vintage", "Graphic", "Summer"]);
      } else {
        console.log("No more t-shirts available for voting");
        
        // If we have completed ASINs but no results, double check if there are any t-shirts available 
        // that we haven't voted on
        if (completedAsins.length > 0) {
          const { count: remainingCount } = await supabase
            .from("tshirts")
            .select("*", { count: "exact", head: true })
            .eq("ready_for_voting", true);
            
          console.log(`Total t-shirts: ${totalReadyCount}, Completed: ${completedAsins.length}`);
          
          if (remainingCount > completedAsins.length) {
            // This indicates a query issue - there should be more t-shirts
            setError("Error fetching next t-shirt. Please try refreshing the page.");
          } else {
            // All t-shirts have been voted on
            toast("All done!", {
              description: "You've completed voting on all available t-shirts.",
              position: "bottom-right"
            });
            setError("No more t-shirts available for voting.");
          }
        } else {
          // No t-shirts are ready for this user despite there being t-shirts in the system
          setError("No t-shirts are currently available for voting. Please try again later.");
        }
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
