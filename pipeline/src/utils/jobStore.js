// In-memory job store. Each job tracks its full lifecycle.
const jobs = new Map();

// Remove jobs that have been finished or untouched for more than 2 hours
const TTL_MS = 2 * 60 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, job] of jobs) {
    if (new Date(job.updatedAt).getTime() < cutoff) jobs.delete(id);
  }
}, 15 * 60 * 1000).unref(); // unref so the timer doesn't keep the process alive

function createJob(id) {
  const job = {
    id,
    status: 'queued',   // queued | cloning | animating | done | failed
    step: null,
    progress: 0,
    inputFiles: {},
    outputFile: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  return job;
}

module.exports = { createJob, getJob, updateJob };
