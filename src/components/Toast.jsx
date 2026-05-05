export function Toast({ message, variant = 'info', onDismiss }) {
  return (
    <div className={`toast toast-${variant}`} onClick={onDismiss} role="alert">
      <span className="toast-msg">{message}</span>
      <button className="toast-close" aria-label="Dismiss">&times;</button>
    </div>
  );
}
