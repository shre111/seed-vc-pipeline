const STEPS = [
  { key: 'queued',     label: 'Job queued' },
  { key: 'cloning',    label: 'Cloning voice (Seed-VC)' },
  { key: 'animating',  label: 'Animating avatar (SadTalker)' },
  { key: 'processing', label: 'Post-processing (FFmpeg)' },
  { key: 'done',       label: 'Done' },
];

function stepIndex(status) {
  return STEPS.findIndex(s => s.key === status);
}

export function StatusPanel({ status, progress, error }) {
  if (status === 'idle') return null;

  const current = stepIndex(status);

  return (
    <div className="status-panel">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-label">{progress}%</p>

      <ol className="steps">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending';
          return (
            <li key={step.key} className={`step step--${state}`}>
              <span className="step-dot" />
              {step.label}
            </li>
          );
        })}
      </ol>

      {status === 'failed' && (
        <p className="error-msg">{error || 'Something went wrong.'}</p>
      )}
    </div>
  );
}
