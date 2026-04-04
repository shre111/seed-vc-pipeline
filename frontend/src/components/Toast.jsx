import { useEffect } from 'react';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast--${toast.type}`}>
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>✕</button>
    </div>
  );
}
