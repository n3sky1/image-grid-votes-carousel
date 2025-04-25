
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVotingStats = () => {
  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);

  const fetchVotingStats = useCallback(async () => {
    try {
      console.log("VotingStats: Starting to fetch voting stats");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("VotingStats: No authenticated user found");
        setUserCompletedCount(0);
        setTotalReadyCount(0);
        return;
      }

      // Get ALL t-shirts that are ready for voting
      const { data: readyTshirts, error: readyError } = await supabase
        .from("tshirts")
        .select("asin")
        .eq("ready_for_voting", true);
      
      if (readyError) {
        console.error("VotingStats: Error fetching ready tshirts:", readyError);
        return;
      }
      
      // Get the user's completed votings
      const { data: completedVotings, error: completedError } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", session.user.id);
      
      if (completedError) {
        console.error("VotingStats: Error fetching completed votings:", completedError);
        return;
      }
      
      // Calculate counts
      const readyTshirtCount = readyTshirts?.length || 0;
      const completedCount = completedVotings?.length || 0;
      
      // To calculate the real "total", we need the union of ready tshirts and completed votings
      // because some completed tshirts might no longer be "ready for voting"
      const completedAsins = new Set(completedVotings?.map(cv => cv.asin) || []);
      const readyAsins = new Set(readyTshirts?.map(rt => rt.asin) || []);
      
      // Find tshirts that are both ready and not completed
      const remainingAsins = [...readyAsins].filter(asin => !completedAsins.has(asin));
      
      // Total is the number of remaining tshirts plus the number of completed votings
      const totalCount = remainingAsins.length + completedCount;
      
      console.log(`VotingStats: Ready tshirts: ${readyTshirtCount}, Completed votings: ${completedCount}`);
      console.log(`VotingStats: Remaining tshirts: ${remainingAsins.length}, Total count: ${totalCount}`);
      
      setTotalReadyCount(totalCount);
      setUserCompletedCount(completedCount);
    } catch (err) {
      console.error("VotingStats: Error fetching voting stats:", err);
      setUserCompletedCount(0);
      setTotalReadyCount(0);
    }
  }, []);

  useEffect(() => {
    fetchVotingStats();
    
    // Set up realtime subscription to update counts when tables change
    const completedVotingsChannel = supabase
      .channel('voting-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_votings',
        },
        () => {
          console.log('VotingStats: Completed votings changed, refreshing stats');
          fetchVotingStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tshirts',
          filter: "ready_for_voting=eq.true",
        },
        () => {
          console.log('VotingStats: Ready t-shirts changed, refreshing stats');
          fetchVotingStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(completedVotingsChannel);
    };
  }, [fetchVotingStats]);

  return { userCompletedCount, totalReadyCount, refreshStats: fetchVotingStats };
};
