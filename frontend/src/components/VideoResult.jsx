export function VideoResult({ downloadUrl }) {
  if (!downloadUrl) return null;

  return (
    <div className="video-result card">
      <div className="video-result-header">
        <span className="video-ready-badge">Ready</span>
        <h2>Your avatar video</h2>
      </div>
      <div className="video-wrapper">
        <video controls autoPlay loop src={downloadUrl} />
      </div>
      <a className="download-btn" href={downloadUrl} download="avatar_video.mp4">
        <span>↓</span> Download MP4
      </a>
    </div>
  );
}
