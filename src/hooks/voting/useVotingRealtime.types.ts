
import { SupabaseClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UseVotingRealtimeProps {
  asin: string;
  onVotingCompleted?: () => void;
  setShowRegeneratingOverlay: (show: boolean) => void;
  setRegenerating: (regenerating: boolean) => void;
  fetchImages: () => void;
}

export interface RealtimeHandlers {
  showWinningVoteOverlay: boolean;
}

export interface RealtimeSubscriptionContext {
  asin: string;
  onVotingCompleted?: () => void;
  setShowRegeneratingOverlay: (show: boolean) => void;
  setRegenerating: (regenerating: boolean) => void;
  fetchImages: () => void;
  setShowWinningVoteOverlay: (show: boolean) => void;
}
