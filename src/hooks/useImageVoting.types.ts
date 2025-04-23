
import { ImageData } from "@/types/image";

export interface UseImageVotingState {
  originalImage: ImageData | null;
  conceptImages: ImageData[];
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  setVotedImages: React.Dispatch<React.SetStateAction<Record<string, 'like' | 'dislike' | 'love'>>>;
  repairedImages: Record<string, boolean>;
  setRepairedImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allVoted: boolean;
  loading: boolean;
  error: string | null;
  promptText: string;
  setPromptText: React.Dispatch<React.SetStateAction<string>>;
  useTestData: boolean;
  toggleDataSource: () => void;
  fetchImages: () => Promise<void>;
  showRegeneratingOverlay: boolean;
}
