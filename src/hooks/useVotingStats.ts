
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

      // Get the count of all ready-for-voting t-shirts
      const { count: readyCount } = await supabase
        .from("tshirts")
        .select("asin", { count: "exact", head: true })
        .eq("ready_for_voting", true);
      
      // Get the user's completed votings count
      const { count: completedCount } = await supabase
        .from("completed_votings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id);
      
      console.log(`Stats: Ready count: ${readyCount}, Completed count: ${completedCount}`);
      
      setTotalReadyCount(readyCount ?? 0);
      setUserCompletedCount(completedCount ?? 0);
    } catch (err) {
      console.error("Error fetching voting stats:", err);
      setUserCompletedCount(0);
      setTotalReadyCount(0);
    }
  }, []);

  useEffect(() => {
    fetchVotingStats();
    
    // Set up realtime subscription to update counts when completed_votings changes
    const completedVotingsChannel = supabase
      .channel('voting-stats')
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
      .subscribe();
      
    return () => {
      supabase.removeChannel(completedVotingsChannel);
    };
  }, [fetchVotingStats]);

  return { userCompletedCount, totalReadyCount, refreshStats: fetchVotingStats };
};
