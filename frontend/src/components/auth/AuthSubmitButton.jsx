import { authSubmitClassName } from './authUi';

export default function AuthSubmitButton({
  isSubmitting,
  loadingLabel,
  label,
  type = 'submit',
  disabled,
}) {
  return (
    <button
      type={type}
      disabled={disabled ?? isSubmitting}
      className={authSubmitClassName}
    >
      {isSubmitting ? (
        <>
          <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
