
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { toast } from "@/components/ui/sonner";

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
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', conceptId],
    queryFn: async () => {
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
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
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
      toast('Comment added successfully');
    },
    onError: () => {
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

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px]"
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim() || addCommentMutation.isPending}
        >
          <MessageCircle className="mr-2" />
          Post Comment
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-600">
              {new Date(comment.created_at).toLocaleDateString()}
            </div>
            <p className="text-gray-800">{comment.content}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLikeMutation.mutate({
                commentId: comment.id,
                isLiked: comment.user_has_liked
              })}
              disabled={toggleLikeMutation.isPending}
            >
              <ThumbsUp 
                className={comment.user_has_liked ? "text-blue-500 fill-blue-500" : ""} 
              />
              <span className="ml-2">{comment.likes}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
