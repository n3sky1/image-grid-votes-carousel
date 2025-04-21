
interface VotingErrorProps {
  error: string;
}
const VotingError = ({ error }: VotingErrorProps) => (
  <div className="flex items-center justify-center min-h-[300px] text-red-500 text-lg w-full">
    {error}
  </div>
);

export default VotingError;
