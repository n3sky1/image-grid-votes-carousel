
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface TagVotingProps {
  asin: string;
  suggestedTags: string[];
}

const TagVoting = ({ asin, suggestedTags }: TagVotingProps) => {
  const [tagVotes, setTagVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTagVotes();
  }, [asin]);

  const fetchTagVotes = async () => {
    const { data, error } = await supabase
      .from('tag_votes')
      .select('tag_name, votes')
      .eq('tshirt_asin', asin);

    if (error) {
      console.error('Error fetching tag votes:', error);
      return;
    }

    const votesMap = data.reduce((acc, curr) => {
      acc[curr.tag_name] = curr.votes;
      return acc;
    }, {} as Record<string, number>);

    setTagVotes(votesMap);
  };

  const handleTagVote = async (tagName: string) => {
    const { error } = await supabase
      .rpc('increment_tag_vote', {
        p_tag_name: tagName,
        p_tshirt_asin: asin
      });

    if (error) {
      console.error('Error voting for tag:', error);
      return;
    }

    setTagVotes(prev => ({
      ...prev,
      [tagName]: (prev[tagName] || 0) + 1
    }));
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
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleTagVote(tag)}
          >
            {tag}
            {tagVotes[tag] > 0 && (
              <span className="ml-1.5 text-xs text-gray-500">
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
