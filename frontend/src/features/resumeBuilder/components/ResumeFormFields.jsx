function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-on-surface mb-1">{children}</label>;
}

export function ResumeTextInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
      />
    </div>
  );
}

export function ResumeTextArea({ label, value, onChange, placeholder = '', rows = 4 }) {
  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-secondary/40"
      />
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-amber-100 text-amber-800',
    failed: 'bg-error-container text-error',
    uploaded: 'bg-surface-container text-on-surface-variant',
  };

  const labels = {
    completed: 'Completed',
    processing: 'Processing',
    failed: 'Failed',
    uploaded: 'Uploaded',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.uploaded}`}
    >
      {labels[status] || status}
    </span>
  );
}
