
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVotingStats = () => {
  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);

  const fetchVotingStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUserCompletedCount(0);
        setTotalReadyCount(0);
        return;
      }

      // First, get the count of ready t-shirts
      const { count: readyCount, error: readyError } = await supabase
        .from("tshirts")
        .select("asin", { count: "exact", head: true })
        .eq("ready_for_voting", true);
      
      if (readyError) {
        console.error("Error fetching ready count:", readyError);
        return;
      }
      
      // Next, get the user's completed votings
      const { data: completedVotings, error: completedError } = await supabase
        .from("completed_votings")
        .select("asin")
        .eq("user_id", session.user.id);
      
      if (completedError) {
        console.error("Error fetching completed votings:", completedError);
        return;
      }
      
      // Calculate remaining count (this ensures the numbers make logical sense)
      const completedCount = completedVotings?.length || 0;
      const total = readyCount || 0;

      console.log(`Stats: Total ready: ${total}, User completed: ${completedCount}`);
      
      setTotalReadyCount(total);
      setUserCompletedCount(completedCount);
    } catch (err) {
      console.error("Error fetching voting stats:", err);
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
          console.log('Completed votings changed, refreshing stats');
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
          console.log('Ready t-shirts changed, refreshing stats');
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
