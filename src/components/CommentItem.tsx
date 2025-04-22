
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    likes: number;
    user_has_liked: boolean;
  };
  onToggleLike: (commentId: string, isLiked: boolean) => void;
  isLikeLoading: boolean;
}

const CommentItem = ({ comment, onToggleLike, isLikeLoading }: CommentItemProps) => {
  return (
    <div className="border rounded p-2 space-y-1 bg-gray-50/80">
      <p className="text-xs text-gray-800">{comment.content}</p>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-500">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLike(comment.id, comment.user_has_liked)}
          disabled={isLikeLoading}
          className="h-6 px-1"
        >
          <ThumbsUp 
            className={`h-3 w-3 ${comment.user_has_liked ? "text-blue-500 fill-blue-500" : ""}`} 
          />
          <span className="ml-1 text-[10px]">{comment.likes}</span>
        </Button>
      </div>
    </div>
  );
};

export default CommentItem;
