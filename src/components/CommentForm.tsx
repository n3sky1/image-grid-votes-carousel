
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}

const CommentForm = ({ onSubmit, isSubmitting }: CommentFormProps) => {
  const [newComment, setNewComment] = useState('');
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onSubmit(newComment);
    setNewComment('');
    setIsCommentFormOpen(false);
    toast('Comment added successfully');
  };

  return (
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
              disabled={!newComment.trim() || isSubmitting}
              className="text-xs h-7 px-2"
            >
              Post
            </Button>
          </div>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CommentForm;
