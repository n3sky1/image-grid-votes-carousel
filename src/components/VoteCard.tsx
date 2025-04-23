
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";

interface VoteCardProps {
  onVote: (vote: 'like' | 'dislike' | 'love') => void;
  currentVote?: 'like' | 'dislike' | 'love';
}

export const VoteCard = ({ onVote, currentVote }: VoteCardProps) => {
  const handleVote = (vote: 'like' | 'dislike' | 'love') => {
    onVote(vote);
  };

  return (
    <div className="flex justify-center gap-2 pt-2 bg-white">
      <button
        onClick={() => handleVote('dislike')}
        className={`${currentVote === 'dislike' ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
      >
        <ThumbsDown size={16} />
      </button>
      <button
        onClick={() => handleVote('like')}
        className={`${currentVote === 'like' ? 'text-green-500' : 'text-gray-500'} hover:text-green-500`}
      >
        <ThumbsUp size={16} />
      </button>
      <button
        onClick={() => handleVote('love')}
        className={`${currentVote === 'love' ? 'text-pink-500' : 'text-gray-500'} hover:text-pink-500`}
      >
        <Heart size={16} />
      </button>
    </div>
  );
};
