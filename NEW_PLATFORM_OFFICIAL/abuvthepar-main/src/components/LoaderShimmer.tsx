export function LoaderShimmer() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="text-muted-foreground">Analyzing your request...</span>
      </div>
    </div>
  );
}