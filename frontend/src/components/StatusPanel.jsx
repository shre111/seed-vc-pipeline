const STEPS = [
  { key: 'queued',     label: 'Job queued',                  icon: '⏳' },
  { key: 'cloning',    label: 'Cloning voice (Seed-VC)',      icon: '🎙' },
  { key: 'animating',  label: 'Animating avatar (SadTalker)', icon: '🎬' },
  { key: 'processing', label: 'Post-processing (FFmpeg)',     icon: '⚙️' },
  { key: 'done',       label: 'Done',                        icon: '✅' },
];

function stepIndex(status) {
  return STEPS.findIndex(s => s.key === status);
}

export function StatusPanel({ status, progress, error }) {
  if (status === 'idle') return null;

  const current = stepIndex(status);

  return (
    <div className="status-panel card">
      <div className="status-header">
        <span className="status-title">Pipeline Progress</span>
        <span className="progress-pct">{progress}%</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <ol className="steps">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending';
          return (
            <li key={step.key} className={`step step--${state}`}>
              <span className="step-indicator">
                {state === 'done'   && <span className="step-check">✓</span>}
                {state === 'active' && <span className="step-spinner" />}
                {state === 'pending' && <span className="step-dot" />}
              </span>
              <span className="step-icon">{step.icon}</span>
              <span className="step-label">{step.label}</span>
            </li>
          );
        })}
      </ol>

      {status === 'failed' && (
        <div className="error-msg">
          <span className="error-icon">✕</span>
          {error || 'Something went wrong.'}
        </div>
      )}
    </div>
  );
}
