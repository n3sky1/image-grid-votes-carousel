
import { ImageData } from "./image";

export interface ImageVotingGridProps {
  asin: string;
}

export interface OriginalImageSectionProps {
  originalImage: ImageData | null;
  promptText: string;
  onOriginalAction: (action: "copyrighted" | "no-design" | "cant-design") => void;
  onEditPrompt: () => void;
  onToggleDataSource: () => void;
  useTestData: boolean;
}
