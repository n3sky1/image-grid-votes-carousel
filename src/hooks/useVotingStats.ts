
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVotingStats = () => {
  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);
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
        setLoading(false);
        return;
      }

      // 1. Get count of ALL t-shirts that are ready for voting
      const { count: readyCount, error: readyError } = await supabase
        .from("tshirts")
        .select("asin", { count: 'exact', head: false })
        .eq("ready_for_voting", true);
      
      if (readyError) {
        console.error("VotingStats: Error fetching ready tshirts count:", readyError);
        setLoading(false);
        return;
      }
      
      // 2. Get count of the user's completed votings
      const { count: completedCount, error: completedError } = await supabase
        .from("completed_votings")
        .select("asin", { count: 'exact', head: false })
        .eq("user_id", session.user.id);
      
      if (completedError) {
        console.error("VotingStats: Error fetching completed votings count:", completedError);
        setLoading(false);
        return;
      }
      
      const actualReadyCount = readyCount || 0;
      const actualCompletedCount = completedCount || 0;
      
      console.log(`VotingStats: Ready tshirt count: ${actualReadyCount}`);
      console.log(`VotingStats: User completed count: ${actualCompletedCount}`);
      
      setTotalReadyCount(actualReadyCount);
      setUserCompletedCount(actualCompletedCount);
      setLoading(false);
    } catch (err) {
      console.error("VotingStats: Error fetching voting stats:", err);
      setUserCompletedCount(0);
      setTotalReadyCount(0);
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

  return { 
    userCompletedCount, 
    totalReadyCount, 
    refreshStats: fetchVotingStats,
    loading 
  };
};
