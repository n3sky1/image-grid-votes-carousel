
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVotingStats = () => {
  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);
  const [remainingCount, setRemainingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVotingStats = useCallback(async () => {
    try {
      console.log("VotingStats: Starting to fetch voting stats");
      setLoading(true);
      
      // Get the current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("VotingStats: Auth session error:", sessionError);
        return;
      }
      
      if (!session?.user) {
        console.log("VotingStats: No authenticated user found");
        setUserCompletedCount(0);
        setTotalReadyCount(0);
        setRemainingCount(0);
        setLoading(false);
        return;
      }

      // Get ALL t-shirts that are ready for voting
      const { data: readyTshirts, error: readyError } = await supabase
        .from("tshirts")
        .select("asin")
        .eq("ready_for_voting", true);
      
      if (readyError) {
        console.error("VotingStats: Error fetching ready tshirts:", readyError);
        setLoading(false);
        return;
      }
      
      // Get user's completed votings
      const { data: completedVotings, error: completedError } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", session.user.id);
      
      if (completedError) {
        console.error("VotingStats: Error fetching completed votings:", completedError);
        setLoading(false);
        return;
      }

      // Convert to arrays of ASINs for easy filtering
      const readyAsins = readyTshirts?.map(t => t.asin) || [];
      const completedAsins = completedVotings?.map(c => c.asin) || [];
      
      console.log(`VotingStats: Total ready t-shirts: ${readyAsins.length}`);
      console.log(`VotingStats: User completed count: ${completedAsins.length}`);
      
      // Calculate the counts
      const actualTotalReady = readyAsins.length;
      const actualCompleted = completedVotings?.length || 0;
      
      // Calculate how many ready t-shirts the user hasn't voted on yet
      const remainingAsins = readyAsins.filter(asin => !completedAsins.includes(asin));
      console.log(`VotingStats: Remaining t-shirts to vote on: ${remainingAsins.length}`);
      
      setTotalReadyCount(actualTotalReady);
      setUserCompletedCount(actualCompleted);
      setRemainingCount(remainingAsins.length);
      setLoading(false);
    } catch (err) {
      console.error("VotingStats: Error fetching voting stats:", err);
      setUserCompletedCount(0);
      setTotalReadyCount(0);
      setRemainingCount(0);
      setLoading(false);
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
        },
        () => {
          console.log('VotingStats: Tshirts changed, refreshing stats');
          fetchVotingStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(completedVotingsChannel);
    };
  }, [fetchVotingStats]);

  return { 
    userCompletedCount, 
    totalReadyCount,
    remainingCount, 
    refreshStats: fetchVotingStats,
    loading 
  };
};
