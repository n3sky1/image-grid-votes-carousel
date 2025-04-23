
import { ImageData } from "@/types/image";

export type VoteType = 'like' | 'dislike' | 'love';
export type VotedImagesMap = Record<string, VoteType>;
export type RepairedImagesMap = Record<string, boolean>;

export interface ImageVotingState {
  originalImage: ImageData | null;
  conceptImages: ImageData[];
  votedImages: VotedImagesMap;
  repairedImages: RepairedImagesMap;
  allVoted: boolean;
  loading: boolean;
  error: string | null;
  promptText: string;
  showRegeneratingOverlay: boolean;
  regenerating: boolean;
}

export interface ImageVotingActions {
  setVotedImages: (id: string, vote: VoteType) => Promise<void>;
  setRepairedImages: React.Dispatch<React.SetStateAction<RepairedImagesMap>>;
  setPromptText: React.Dispatch<React.SetStateAction<string>>;
  setShowRegeneratingOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  setRegenerating: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDataSource: () => void;
  fetchImages: () => Promise<void>;
}
