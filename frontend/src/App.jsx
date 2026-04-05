import { useState } from 'react';
import { FileInput } from './components/FileInput';
import { ExampleFaces } from './components/ExampleFaces';
import { StatusPanel } from './components/StatusPanel';
import { VideoResult } from './components/VideoResult';
import { usePipeline } from './hooks/usePipeline';

function ReadinessPill({ label, done }) {
  return (
    <span className={`readiness-pill${done ? ' readiness-pill--done' : ''}`}>
      <span className="readiness-dot">{done ? '✓' : '○'}</span>
      {label}
    </span>
  );
}

export default function App() {
  const [sourceAudio, setSourceAudio] = useState(null);
  const [targetAudio, setTargetAudio] = useState(null);
  const [faceImage,   setFaceImage]   = useState(null);

  const { status, progress, error, downloadUrl, submit, reset } = usePipeline();

  const isRunning = ['submitting', 'queued', 'cloning', 'animating', 'processing'].includes(status);
  const canSubmit = sourceAudio && targetAudio && faceImage && !isRunning;

  function handleSubmit(e) {
    e.preventDefault();
    submit({ sourceAudio, targetAudio, faceImage });
  }

  function handleReset() {
    setSourceAudio(null);
    setTargetAudio(null);
    setFaceImage(null);
    reset();
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-badge">AI Pipeline</div>
        <h1>Seed-VC Avatar</h1>
        <p>Clone a voice, animate a face — get a talking avatar video in minutes.</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="upload-form">

          <section className="card">
            <h2 className="section-title">
              <span className="section-icon">🎤</span>
              Audio
            </h2>
            <div className="input-row">
              <FileInput
                label="Source Audio"
                hint="What should be said"
                accept=".wav,.mp3"
                file={sourceAudio}
                onChange={setSourceAudio}
                disabled={isRunning}
              />
              <FileInput
                label="Reference Voice"
                hint="5–30 sec sample to clone"
                accept=".wav,.mp3"
                file={targetAudio}
                onChange={setTargetAudio}
                disabled={isRunning}
              />
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">
              <span className="section-icon">🖼</span>
              Face
            </h2>
            <FileInput
              label="Face Image"
              hint="Front-facing photo or illustration"
              accept=".jpg,.jpeg,.png"
              file={faceImage}
              onChange={setFaceImage}
              disabled={isRunning}
              type="image"
            />
            <ExampleFaces onSelect={setFaceImage} disabled={isRunning} selectedFile={faceImage} />
          </section>

          <div className="readiness-bar">
            <ReadinessPill label="Source Audio"    done={!!sourceAudio} />
            <ReadinessPill label="Reference Voice" done={!!targetAudio} />
            <ReadinessPill label="Face Image"      done={!!faceImage} />
          </div>

          <div className="actions">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-primary${canSubmit ? ' btn-primary--ready' : ''}`}
            >
              {isRunning
                ? <><span className="btn-spinner" />Generating…</>
                : 'Generate Video'}
            </button>
            {(status === 'done' || status === 'failed') && (
              <button type="button" onClick={handleReset} className="btn-secondary">
                Start Over
              </button>
            )}
          </div>
        </form>

        <StatusPanel status={status} progress={progress} error={error} />
        <VideoResult downloadUrl={downloadUrl} />
      </main>
    </div>
  );
}
