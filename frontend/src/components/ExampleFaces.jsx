import { useEffect, useRef, useState } from 'react';

export function ExampleFaces({ onSelect, disabled, selectedFile }) {
  const [faces, setFaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const latestClickRef = useRef(null);

  useEffect(() => {
    fetch('/api/examples/faces')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setFaces(data); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, []);

  // Deselect if user swapped to their own file upload
  useEffect(() => {
    if (!selectedFile || selectedFile.name !== selected) {
      setSelected(null);
    }
  }, [selectedFile, selected]);

  async function handleClick(face) {
    if (disabled) return;
    setSelected(face.name);
    latestClickRef.current = face.name;
    const res = await fetch(face.url);
    const blob = await res.blob();
    if (latestClickRef.current !== face.name) return; // superseded by a newer click
    const file = new File([blob], face.name, { type: blob.type });
    onSelect(file);
  }

  if (loading) return <p className="examples-loading">Loading examples…</p>;
  if (fetchError) return <p className="examples-error">Could not load example faces.</p>;
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
