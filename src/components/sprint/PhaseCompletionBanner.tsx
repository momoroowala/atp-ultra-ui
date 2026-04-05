export const PhaseCompletionBanner = ({ message }: { message: string }) => (
  <div className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white animate-fade-in">
    {message}
  </div>
);
