interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading data..." }: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      <p className="mt-3 text-sm text-slate-600">{message}</p>
    </div>
  );
}
