import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'queued',     label: 'Job queued',                  icon: '⏳' },
  { key: 'cloning',    label: 'Cloning voice (Seed-VC)',      icon: '🎙' },
  { key: 'animating',  label: 'Animating avatar (SadTalker)', icon: '🎬' },
  { key: 'processing', label: 'Post-processing (FFmpeg)',     icon: '⚙️' },
  { key: 'done',       label: 'Done',                        icon: '✅' },
];

const RUNNING = ['queued', 'cloning', 'animating', 'processing'];

function stepIndex(status) {
  return STEPS.findIndex(s => s.key === status);
}

function formatElapsed(s) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function StatusPanel({ status, progress, error }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!RUNNING.includes(status)) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  if (status === 'idle') return null;

  const current = stepIndex(status);
  const connectorPct = Math.min(100, (current / (STEPS.length - 1)) * 100);
  const isRunning = RUNNING.includes(status);

  return (
    <div className={`status-panel card${status === 'done' ? ' status-panel--done' : ''}`}>
      <div className="status-header">
        <span className="status-title">Pipeline Progress</span>
        <div className="status-header-right">
          {isRunning && (
            <span className="elapsed-timer">{formatElapsed(elapsed)}</span>
          )}
          <span className="progress-pct">{progress}%</span>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="steps-wrapper">
        <div className="connector-track">
          <div className="connector-fill" style={{ height: `${connectorPct}%` }} />
        </div>

        <ol className="steps">
          {STEPS.map((step, i) => {
            const state = i < current ? 'done' : i === current ? 'active' : 'pending';
            return (
              <li key={step.key} className={`step step--${state}`}>
                <span className="step-indicator">
                  {state === 'done'    && <span className="step-check">✓</span>}
                  {state === 'active'  && <span className="step-spinner" />}
                  {state === 'pending' && <span className="step-dot" />}
                </span>
                <span className="step-icon">{step.icon}</span>
                <span className="step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {status === 'failed' && (
        <div className="error-msg">
          <span className="error-icon">✕</span>
          {error || 'Something went wrong.'}
        </div>
      )}
    </div>
  );
}
