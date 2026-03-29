export function VideoResult({ downloadUrl }) {
  if (!downloadUrl) return null;

  return (
    <div className="video-result">
      <h2>Your video is ready</h2>
      <video controls autoPlay loop src={downloadUrl} />
      <a className="download-btn" href={downloadUrl} download="avatar_video.mp4">
        Download MP4
      </a>
    </div>
  );
}
