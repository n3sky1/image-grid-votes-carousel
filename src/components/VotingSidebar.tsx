
import VotingProgress from "./VotingProgress";
import { Button } from "@/components/ui/button";

interface VotingSidebarProps {
  votedImages: Record<string, "like" | "dislike" | "love">;
  conceptImagesCount: number;
  useTestData: boolean;
  toggleDataSource: () => void;
}

const VotingSidebar = ({
  votedImages,
  conceptImagesCount,
  useTestData,
  toggleDataSource,
}: VotingSidebarProps) => (
  <>
    <VotingProgress votedImages={votedImages} conceptImagesCount={conceptImagesCount} />
    <Button
      variant={useTestData ? "default" : "outline"}
      onClick={toggleDataSource}
      className={useTestData ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-50"}
    >
      {useTestData ? "Using Test Data" : "Use Test Data"}
    </Button>
  </>
);

export default VotingSidebar;
