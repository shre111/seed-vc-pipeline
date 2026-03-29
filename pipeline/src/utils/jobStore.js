// In-memory job store. Each job tracks its full lifecycle.
const jobs = new Map();

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
