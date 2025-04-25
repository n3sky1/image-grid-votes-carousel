
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "./ui/sonner";

interface VoteCardProps {
  onVote: (vote: 'like' | 'dislike' | 'love') => void;
  currentVote?: 'like' | 'dislike' | 'love';
}

export const VoteCard = ({ onVote, currentVote }: VoteCardProps) => {
  const handleVote = (vote: 'like' | 'dislike' | 'love') => {
    // Show immediate feedback for the love vote
    if (vote === 'love') {
      toast.success("Voting complete!", {
        description: "Moving to the next t-shirt...",
      });
    }
    onVote(vote);
  };

  return (
    <div className="flex justify-center gap-2 pt-2 bg-white">
      <Button
        onClick={() => handleVote('dislike')}
        variant="ghost"
        size="sm"
        className={`${currentVote === 'dislike' ? 'text-red-500 bg-red-50' : 'text-gray-500'} hover:text-red-500 hover:bg-red-50`}
        aria-label={currentVote === 'dislike' ? "Remove dislike vote" : "Dislike"}
        title={currentVote === 'dislike' ? "Remove dislike vote" : "Dislike"}
      >
        <ThumbsDown size={16} />
      </Button>
      <Button
        onClick={() => handleVote('like')}
        variant="ghost"
        size="sm"
        className={`${currentVote === 'like' ? 'text-green-500 bg-green-50' : 'text-gray-500'} hover:text-green-500 hover:bg-green-50`}
        aria-label={currentVote === 'like' ? "Remove like vote" : "Like"}
        title={currentVote === 'like' ? "Remove like vote" : "Like"}
      >
        <ThumbsUp size={16} />
      </Button>
      <Button
        onClick={() => handleVote('love')}
        variant="ghost"
        size="sm"
        className={`${currentVote === 'love' ? 'text-pink-500 bg-pink-50' : 'text-gray-500'} hover:text-pink-500 hover:bg-pink-50`}
        aria-label={currentVote === 'love' ? "Remove love vote" : "Love"}
        title={currentVote === 'love' ? "Remove love vote" : "Love (finalizes voting)"}
      >
        <Heart size={16} className={currentVote === 'love' ? 'fill-pink-500' : ''} />
      </Button>
    </div>
  );
};
