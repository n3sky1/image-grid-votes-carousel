import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
interface VotingProgressProps {
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
  conceptImagesCount: number;
}
const VotingProgress = ({
  votedImages,
  conceptImagesCount
}: VotingProgressProps) => {
  const votedCount = Object.keys(votedImages).length;
  const total = conceptImagesCount + votedCount;
  const percentage = total === 0 ? 0 : votedCount / total * 100;
  return <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Voting Progress for this Design</p>
          <p className="text-sm text-gray-600">
            {votedCount} of {total} voted
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{
          width: `${percentage}%`
        }}></div>
        </div>
        {/* Vote breakdown */}
        {votedCount > 0 && <div className="flex gap-4 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <ThumbsUp size={14} />
              <span>{Object.values(votedImages).filter(v => v === 'like').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown size={14} />
              <span>{Object.values(votedImages).filter(v => v === 'dislike').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-red-500" />
              <span>{Object.values(votedImages).filter(v => v === 'love').length}</span>
            </div>
          </div>}
      </div>
    </div>;
};
export default VotingProgress;