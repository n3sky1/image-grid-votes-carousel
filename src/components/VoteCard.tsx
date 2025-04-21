
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface VoteCardProps {
  onVote: (vote: 'like' | 'dislike' | 'love') => void;
}

export const VoteCard = ({ onVote }: VoteCardProps) => {
  const handleVote = (vote: 'like' | 'dislike' | 'love') => {
    onVote(vote);
    
    const voteText = vote === 'like' ? 'Liked' : vote === 'dislike' ? 'Disliked' : 'Loved';
    toast(voteText, {
      description: `You ${voteText.toLowerCase()} this image`,
      position: "bottom-right",
      icon: getVoteIcon(vote)
    });
  };

  return (
    <div className="flex justify-center gap-2 pt-2 bg-white">
      <button
        onClick={() => handleVote('dislike')}
        className="text-gray-500 hover:text-red-500"
      >
        <ThumbsDown size={16} />
      </button>
      <button
        onClick={() => handleVote('like')}
        className="text-gray-500 hover:text-green-500"
      >
        <ThumbsUp size={16} />
      </button>
      <button
        onClick={() => handleVote('love')}
        className="text-gray-500 hover:text-pink-500"
      >
        <Heart size={16} />
      </button>
    </div>
  );
};

const getVoteIcon = (vote: 'like' | 'dislike' | 'love') => {
  switch (vote) {
    case 'like':
      return <ThumbsUp size={16} className="text-green-500" />;
    case 'dislike':
      return <ThumbsDown size={16} className="text-gray-500" />;
    case 'love':
      return <Heart size={16} className="text-red-500" />;
  }
};
