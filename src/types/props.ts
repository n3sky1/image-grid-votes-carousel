import { ImageData } from "./image";

export interface ImageVotingGridProps {
  asin: string;
  suggestedTags?: string[];
  onVotingCompleted?: () => void;
}

export interface OriginalImageSectionProps {
  originalImage: ImageData | null;
  promptText: string;
  onOriginalAction: (action: "copyrighted" | "no-design" | "cant-design") => void;
  onEditPrompt: () => void;
  onToggleDataSource: () => void;
  useTestData: boolean;
  suggestedTags?: string[];
  totalReadyCount?: number;
  userCompletedCount?: number;
}
