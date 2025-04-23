
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes: number;
  user_has_liked: boolean;
}

export const useComments = (conceptId: string) => {
  const queryClient = useQueryClient();
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conceptId);

  // Get current user id for ownership checks
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', conceptId],
    queryFn: async () => {
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
    staleTime: 10000,
    retry: 1,
    enabled: isValidUUID
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

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string, content: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', conceptId] });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', conceptId] });
    }
  });

  return {
    comments,
    isLoading,
    isValidUUID,
    currentUserId,
    addCommentMutation,
    toggleLikeMutation,
    editCommentMutation,
    deleteCommentMutation
  };
};
