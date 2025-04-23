
import { useComments } from "@/hooks/useComments";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

interface CommentsProps {
  conceptId: string;
}

const Comments = ({ conceptId }: CommentsProps) => {
  const {
    comments,
    isLoading,
    isValidUUID,
    addCommentMutation,
    toggleLikeMutation
  } = useComments(conceptId);

  if (!conceptId || !isValidUUID) {
    return <div className="text-center text-gray-500 text-sm">Comments not available for this concept</div>;
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 text-sm">Loading comments...</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Comments ({comments.length})</h3>
      
      <CommentForm
        onSubmit={(content) => addCommentMutation.mutate(content)}
        isSubmitting={addCommentMutation.isPending}
      />

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onToggleLike={(commentId, isLiked) => 
                toggleLikeMutation.mutate({ commentId, isLiked })}
              isLikeLoading={toggleLikeMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
