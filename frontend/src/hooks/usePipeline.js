import { useState, useRef, useCallback } from 'react';

const API = '/api/pipeline';

export function usePipeline() {
  const [state, setState] = useState({
    status: 'idle',   // idle | submitting | cloning | animating | processing | done | failed
    jobId: null,
    progress: 0,
    step: null,
    outputFile: null,
    error: null,
  });

  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const poll = useCallback((jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/status/${jobId}`);
        const data = await res.json();

        setState(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          step: data.step,
          outputFile: data.outputFile,
          error: data.error,
        }));

        if (data.status === 'done' || data.status === 'failed') {
          stopPolling();
        }
      } catch (err) {
        stopPolling();
        setState(prev => ({ ...prev, status: 'failed', error: 'Lost connection to server' }));
      }
    }, 3000);
  }, []);

  const submit = useCallback(async ({ sourceAudio, targetAudio, faceImage }) => {
    stopPolling();
    setState({ status: 'submitting', jobId: null, progress: 0, step: null, outputFile: null, error: null });

    const form = new FormData();
    form.append('source_audio', sourceAudio);
    form.append('target_audio', targetAudio);
    form.append('face_image', faceImage);

    try {
      const res = await fetch(`${API}/start`, { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setState(prev => ({ ...prev, status: 'queued', jobId: data.jobId }));
      poll(data.jobId);
    } catch (err) {
      setState(prev => ({ ...prev, status: 'failed', error: err.message }));
    }
  }, [poll]);

  const downloadUrl = state.jobId && state.status === 'done'
    ? `${API}/download/${state.jobId}`
    : null;

  const reset = useCallback(() => {
    stopPolling();
    setState({ status: 'idle', jobId: null, progress: 0, step: null, outputFile: null, error: null });
  }, []);

  return { ...state, submit, reset, downloadUrl };
}
