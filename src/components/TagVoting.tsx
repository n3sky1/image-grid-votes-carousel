
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "./AuthProvider";

interface TagVotingProps {
  asin: string;
  suggestedTags?: string[];
}

interface TagVote {
  tag_name: string;
  votes: number;
}

const TagVoting = ({ asin, suggestedTags = [] }: TagVotingProps) => {
  const [tagVotes, setTagVotes] = useState<Record<string, number>>({});
  const { user } = useAuth();

  useEffect(() => {
    fetchTagVotes();
  }, [asin]);

  const fetchTagVotes = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_tag_votes', { p_tshirt_asin: asin });

      if (error) {
        console.error('Error fetching tag votes:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        const votesMap = data.reduce((acc: Record<string, number>, curr: TagVote) => {
          acc[curr.tag_name] = curr.votes;
          return acc;
        }, {});
        
        setTagVotes(votesMap);
      }
    } catch (err) {
      console.error('Unexpected error fetching tag votes:', err);
    }
  };

  const handleTagVote = async (tagName: string) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      return;
    }

    try {
      // Call the Edge Function instead of using RPC directly
      const response = await fetch("https://hdfxqwkuirbizwqrvtsd.supabase.co/functions/v1/increment_tag_vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
        },
        body: JSON.stringify({
          p_tag_name: tagName,
          p_tshirt_asin: asin
        })
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      setTagVotes(prev => ({
        ...prev,
        [tagName]: (prev[tagName] || 0) + 1
      }));

      toast.success(`Voted for tag: ${tagName}`);
    } catch (err) {
      console.error('Error voting for tag:', err);
      toast.error('Failed to register your vote');
    }
  };

  if (!suggestedTags?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Tag className="h-4 w-4" />
        Choose tags:
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestedTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 transition-colors duration-200 group"
            onClick={() => handleTagVote(tag)}
          >
            {tag}
            {tagVotes[tag] > 0 && (
              <span className="ml-1.5 text-xs text-gray-500 group-hover:text-blue-700">
                {tagVotes[tag]}
              </span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TagVoting;
