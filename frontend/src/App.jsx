import { useState } from 'react';
import { FileInput } from './components/FileInput';
import { ExampleFaces } from './components/ExampleFaces';
import { StatusPanel } from './components/StatusPanel';
import { VideoResult } from './components/VideoResult';
import { usePipeline } from './hooks/usePipeline';

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
      <header>
        <h1>Seed-VC Avatar Pipeline</h1>
        <p>Clone a voice, animate a face, get a talking avatar video.</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="upload-form">
          <FileInput
            label="Source Audio"
            hint="The audio that contains what should be said"
            accept=".wav,.mp3"
            file={sourceAudio}
            onChange={setSourceAudio}
            disabled={isRunning}
          />
          <FileInput
            label="Reference Voice"
            hint="A short sample of the voice to clone (5-30 sec)"
            accept=".wav,.mp3"
            file={targetAudio}
            onChange={setTargetAudio}
            disabled={isRunning}
          />
          <FileInput
            label="Face Image"
            hint="A clear front-facing photo or illustration"
            accept=".jpg,.jpeg,.png"
            file={faceImage}
            onChange={setFaceImage}
            disabled={isRunning}
          />
          <ExampleFaces onSelect={setFaceImage} disabled={isRunning} />

          <div className="actions">
            <button type="submit" disabled={!canSubmit} className="btn-primary">
              {isRunning ? 'Generating...' : 'Generate Video'}
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
