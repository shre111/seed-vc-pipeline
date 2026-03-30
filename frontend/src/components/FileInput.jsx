import { useRef, useState } from 'react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileInput({ label, hint, accept, file, onChange, disabled, type = 'file' }) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const isImage = type === 'image';
  const previewUrl = isImage && file ? URL.createObjectURL(file) : null;

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  }

  return (
    <div className="file-input">
      <label htmlFor={id}>
        <span className="file-input-icon">{isImage ? '🖼' : '🎵'}</span>
        {label}
      </label>
      <p className="hint">{hint}</p>

      <div
        className={`drop-zone ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''} ${dragging ? 'dragging' : ''} ${isImage && file ? 'has-preview' : ''}`}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={e => onChange(e.target.files[0] || null)}
        />

        {isImage && previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="preview" />
            <div className="image-preview-overlay">
              <span>{file.name}</span>
            </div>
          </div>
        ) : (
          <div className="drop-zone-content">
            <span className="drop-icon">{dragging ? '⬇' : file ? '✓' : '+'}</span>
            <span className="drop-label">
              {file ? file.name : dragging ? 'Drop it!' : 'Click or drag file here'}
            </span>
            {file && <span className="file-meta">{formatSize(file.size)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
