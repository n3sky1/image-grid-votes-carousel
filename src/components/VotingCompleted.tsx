
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";

interface VotingCompletedProps {
  votedImages: Record<string, 'like' | 'dislike' | 'love'>;
}

const VotingCompleted = ({ votedImages }: VotingCompletedProps) => (
  <div className="w-full max-w-6xl mx-auto p-6">
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">All Done!</h2>
      <p className="text-lg text-gray-600 mb-6">
        Thank you for reviewing and voting on all the images.
      </p>
      <div className="flex justify-center gap-4 mb-8">
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
          <ThumbsUp className="text-green-500 mb-2" size={24} />
          <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'like').length}</span>
          <span className="text-sm text-gray-500">Likes</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
          <ThumbsDown className="text-gray-500 mb-2" size={24} />
          <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'dislike').length}</span>
          <span className="text-sm text-gray-500">Dislikes</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
          <Heart className="text-red-500 mb-2" size={24} />
          <span className="font-bold text-xl">{Object.values(votedImages).filter(v => v === 'love').length}</span>
          <span className="text-sm text-gray-500">Loves</span>
        </div>
      </div>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Start Over
      </button>
    </div>
  </div>
);

export default VotingCompleted;
