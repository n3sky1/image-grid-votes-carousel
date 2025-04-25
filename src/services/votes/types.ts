
export type VoteType = 'like' | 'dislike' | 'love';

export interface VoteOperationResult {
  success: boolean;
  error?: string;
}
