
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    likes: number;
    user_has_liked: boolean;
  };
  isMine: boolean;
  onToggleLike: (commentId: string, isLiked: boolean) => void;
  isLikeLoading: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  isEditLoading?: boolean;
  isDeleteLoading?: boolean;
}

const CommentItem = ({
  comment,
  isMine,
  onToggleLike,
  isLikeLoading,
  onEdit,
  onDelete,
  isEditLoading,
  isDeleteLoading,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = () => {
    setEditValue(comment.content);
    setIsEditing(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEdit && editValue.trim()) {
      onEdit(comment.id, editValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="border rounded p-2 space-y-1 bg-gray-50/80">
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
          <input
            className="flex-1 text-xs border rounded px-2 py-1"
            value={editValue}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            disabled={isEditLoading}
          />
          <Button type="submit" size="sm" className="h-6 px-2" disabled={isEditLoading}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1"
            onClick={() => setIsEditing(false)}
            disabled={isEditLoading}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <p className="text-xs text-gray-800">{comment.content}</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLike(comment.id, comment.user_has_liked)}
                disabled={isLikeLoading}
                className="h-6 px-1"
                title="Like"
              >
                <ThumbsUp
                  className={`h-3 w-3 ${comment.user_has_liked ? "text-blue-500 fill-blue-500" : ""}`}
                />
                <span className="ml-1 text-[10px]">{comment.likes}</span>
              </Button>
              {isMine && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1"
                    title="Edit"
                    onClick={startEdit}
                    disabled={isEditLoading || isDeleteLoading}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1"
                    title="Delete"
                    onClick={() => onDelete?.(comment.id)}
                    disabled={isDeleteLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommentItem;
