
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAiModel = (asin: string) => {
  const [aiRecommendedModel, setAiRecommendedModel] = useState<string>("");

  useEffect(() => {
    const fetchModel = async () => {
      const { data } = await supabase
        .from("tshirts")
        .select("ai_recommended_model")
        .eq("asin", asin)
        .maybeSingle();
      setAiRecommendedModel(data?.ai_recommended_model ?? "");
    };
    fetchModel();
  }, [asin]);

  return aiRecommendedModel;
};
