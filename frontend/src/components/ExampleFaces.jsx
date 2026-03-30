import { useEffect, useState } from 'react';

export function ExampleFaces({ onSelect, disabled, selectedFile }) {
  const [faces, setFaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/examples/faces')
      .then(r => r.json())
      .then(data => { setFaces(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Deselect if user swapped to their own file upload
  useEffect(() => {
    if (!selectedFile || selectedFile.name !== selected) {
      setSelected(null);
    }
  }, [selectedFile]);

  async function handleClick(face) {
    if (disabled) return;
    setSelected(face.name);
    const res = await fetch(face.url);
    const blob = await res.blob();
    const file = new File([blob], face.name, { type: blob.type });
    onSelect(file);
  }

  if (loading) return <p className="examples-loading">Loading examples…</p>;
  if (!faces.length) return null;

  return (
    <div className={`example-faces ${disabled ? 'disabled' : ''}`}>
      <p className="examples-label">Or pick an example face</p>
      <div className="faces-grid">
        {faces.map(face => (
          <button
            key={face.name}
            type="button"
            className={`face-thumb ${selected === face.name ? 'face-thumb--selected' : ''}`}
            onClick={() => handleClick(face)}
            disabled={disabled}
            title={face.name.replace(/\.[^.]+$/, '')}
          >
            <img src={face.url} alt={face.name} loading="lazy" />
            {selected === face.name && <span className="face-thumb-check">✓</span>}
          </button>
        ))}
      </div>
      {selected && (
        <p className="examples-selected-name">{selected.replace(/\.[^.]+$/, '')}</p>
      )}
    </div>
  );
}
