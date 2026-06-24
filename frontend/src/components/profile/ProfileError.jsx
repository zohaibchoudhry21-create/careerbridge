export default function ProfileError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-error/20 bg-error-container/30 dashboard-card-padding text-center">
      <p className="font-body-md text-on-surface mb-md">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-md py-sm bg-secondary text-white rounded-xl font-label-md"
      >
        Try again
      </button>
    </div>
  );
}
