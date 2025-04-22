
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes: number;
  user_has_liked: boolean;
}

interface CommentsProps {
  conceptId: string;
}

const Comments = ({ conceptId }: CommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check if the conceptId is a valid UUID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conceptId);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', conceptId],
    queryFn: async () => {
      // If not a valid UUID, return empty array to prevent database errors
      if (!isValidUUID) {
        console.log(`Invalid UUID format for conceptId: ${conceptId}`);
        return [];
      }

      try {
        const { data: comments, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            comment_likes (count)
          `)
          .eq('concept_id', conceptId);

        if (error) throw error;
        
        const { data: userLikes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        const userLikedComments = new Set(userLikes?.map(like => like.comment_id));

        return comments.map(comment => ({
          ...comment,
          likes: comment.comment_likes?.[0]?.count || 0,
          user_has_liked: userLikedComments.has(comment.id)
        }));
      } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    // Reduce refetch frequency to prevent excessive requests
    staleTime: 10000, // 10 seconds
    retry: 1, // Only retry once if there's an error
    enabled: isValidUUID // Only run the query if the UUID is valid
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!isValidUUID) {
        throw new Error('Invalid concept ID format');
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          concept_id: conceptId,
          content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', conceptId] });
      setNewComment('');
      setIsCommentFormOpen(false);
      toast('Comment added successfully');
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
      toast('Failed to add comment', {
        description: 'Please try again later'
      });
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string, isLiked: boolean }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', conceptId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (!isValidUUID) {
    return <div className="text-center text-gray-500 text-sm">Comments not available for this concept</div>;
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 text-sm">Loading comments...</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Comments ({comments.length})</h3>
      
      <Collapsible 
        open={isCommentFormOpen} 
        onOpenChange={setIsCommentFormOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start text-xs h-7 px-2 mb-1"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Add comment
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] text-xs"
            />
            <div className="flex justify-end space-x-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setIsCommentFormOpen(false)}
                className="text-xs h-7 px-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="text-xs h-7 px-2"
              >
                Post
              </Button>
            </div>
          </form>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded p-2 space-y-1 bg-gray-50/80">
              <p className="text-xs text-gray-800">{comment.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLikeMutation.mutate({
                    commentId: comment.id,
                    isLiked: comment.user_has_liked
                  })}
                  disabled={toggleLikeMutation.isPending}
                  className="h-6 px-1"
                >
                  <ThumbsUp 
                    className={`h-3 w-3 ${comment.user_has_liked ? "text-blue-500 fill-blue-500" : ""}`} 
                  />
                  <span className="ml-1 text-[10px]">{comment.likes}</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
