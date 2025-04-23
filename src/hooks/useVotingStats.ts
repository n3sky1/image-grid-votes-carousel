
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVotingStats = () => {
  const [userCompletedCount, setUserCompletedCount] = useState<number>(0);
  const [totalReadyCount, setTotalReadyCount] = useState<number>(0);

  useEffect(() => {
    const fetchVotingStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUserCompletedCount(0);
          setTotalReadyCount(0);
          return;
        }

        const { count: readyCount } = await supabase
          .from("tshirts")
          .select("asin", { count: "exact", head: true })
          .eq("ready_for_voting", true);
        setTotalReadyCount(readyCount ?? 0);

        const { count: completedCount } = await supabase
          .from("completed_votings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setUserCompletedCount(completedCount ?? 0);
      } catch (err) {
        setUserCompletedCount(0);
        setTotalReadyCount(0);
      }
    };
    fetchVotingStats();
  }, []);

  return { userCompletedCount, totalReadyCount };
};
