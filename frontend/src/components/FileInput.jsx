export function FileInput({ label, hint, accept, file, onChange, disabled }) {
  const id = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="file-input">
      <label htmlFor={id}>{label}</label>
      <p className="hint">{hint}</p>
      <div className={`drop-zone ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={e => onChange(e.target.files[0] || null)}
        />
        <span>{file ? file.name : 'Click to choose file'}</span>
      </div>
    </div>
  );
}
