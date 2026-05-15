import { useState, useRef, useCallback, useEffect } from 'react';

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
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const poll = useCallback((jobId) => {
    const tick = async () => {
      try {
        const res = await fetch(`${API}/status/${jobId}`);
        if (!res.ok) throw new Error(`Status check failed (${res.status})`);
        const data = await res.json();

        setState(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          step: data.step,
          outputFile: data.outputFile,
          error: data.error,
        }));

        if (data.status !== 'done' && data.status !== 'failed') {
          pollRef.current = setTimeout(tick, 3000);
        } else {
          pollRef.current = null;
        }
      } catch (err) {
        pollRef.current = null;
        setState(prev => ({ ...prev, status: 'failed', error: 'Lost connection to server' }));
      }
    };
    pollRef.current = setTimeout(tick, 3000);
  }, []);

  const submit = useCallback(async ({ sourceAudio, targetAudio, faceImage, diffusionSteps = 30, lengthAdjust = 1.0, cfgRate = 0.7 }) => {
    stopPolling();
    setState({ status: 'submitting', jobId: null, progress: 0, step: null, outputFile: null, error: null });

    const form = new FormData();
    form.append('source_audio', sourceAudio);
    form.append('target_audio', targetAudio);
    form.append('face_image', faceImage);
    form.append('diffusion_steps', String(diffusionSteps));
    form.append('length_adjust',   String(lengthAdjust));
    form.append('cfg_rate',        String(cfgRate));

    try {
      const res = await fetch(`${API}/start`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      const data = await res.json();

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

  // Stop polling if the consumer component unmounts mid-job
  useEffect(() => () => stopPolling(), []);

  return { ...state, submit, reset, downloadUrl };
}
