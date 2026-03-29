import { useEffect, useState } from 'react';

export function ExampleFaces({ onSelect, disabled }) {
  const [faces, setFaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/examples/faces')
      .then(r => r.json())
      .then(data => { setFaces(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleClick(face) {
    if (disabled) return;
    setSelected(face.name);

    // Fetch the image and turn it into a File object for the upload form
    const res = await fetch(face.url);
    const blob = await res.blob();
    const file = new File([blob], face.name, { type: blob.type });
    onSelect(file);
  }

  if (loading) return <p className="examples-loading">Loading examples...</p>;
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
            title={face.name}
          >
            <img src={face.url} alt={face.name} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
