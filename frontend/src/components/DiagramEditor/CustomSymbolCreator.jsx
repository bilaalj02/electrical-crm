import React, { useRef, useEffect, useState } from 'react';

const DRAW_TOOLS = [
  { id: 'pencil',  label: '✏️ Freehand' },
  { id: 'line',    label: '╱  Line' },
  { id: 'rect',    label: '▭  Rectangle' },
  { id: 'circle',  label: '◯  Circle' },
  { id: 'text',    label: 'T  Text' },
  { id: 'eraser',  label: '⌫  Eraser' },
];

const CATEGORIES_FOR_SAVE = [
  'power-sources','basic-switches','wall-devices','receptacles','lighting',
  'protection','panels','transformers','motors-drives','control',
  'sensors','fire-alarm','security','communication','hvac',
  'grounding','electronic','wiring','renewable','measuring','custom',
];

export default function CustomSymbolCreator({ onSave, onClose }) {
  const canvasRef  = useRef(null);
  const [tool, setTool]     = useState('pencil');
  const [color, setColor]   = useState('#1a1a2e');
  const [lineW, setLineW]   = useState(2);
  const [symName, setName]  = useState('');
  const [category, setCat]  = useState('custom');
  const [tags, setTags]     = useState('');
  const [saving, setSaving] = useState(false);
  const [svgImport, setSvgImport] = useState('');
  const [showSvgImport, setShowSvgImport] = useState(false);

  const drawing  = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef(null);

  const SIZE = 240;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Draw crosshair guide lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0); ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2); ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e) => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    drawing.current = true;
    startPos.current = getPos(e);
    snapshot.current = ctx.getImageData(0, 0, SIZE, SIZE);
    if (tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(startPos.current.x, startPos.current.y);
    }
  };

  const onMouseMove = (e) => {
    if (!drawing.current) return;
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const pos = getPos(e);

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineW * 4 : lineW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore snapshot and draw shape preview
      ctx.putImageData(snapshot.current, 0, 0);
      const dx = pos.x - startPos.current.x;
      const dy = pos.y - startPos.current.y;
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.current.x, startPos.current.y, dx, dy);
      } else if (tool === 'circle') {
        const r = Math.sqrt(dx * dx + dy * dy);
        ctx.arc(startPos.current.x, startPos.current.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const onMouseUp = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    if (tool === 'text') {
      const pos = getPos(e);
      const text = window.prompt('Enter text:');
      if (text) {
        ctx.font = `${lineW * 6 + 8}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, pos.x, pos.y);
      }
    }
  };

  const clearCanvas = () => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Redraw guides
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0); ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2); ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const importSvg = () => {
    if (!svgImport.trim()) return;
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgImport], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setShowSvgImport(false);
    setSvgImport('');
  };

  const handleSave = async () => {
    if (!symName.trim()) {
      alert('Please enter a symbol name');
      return;
    }
    const cv = canvasRef.current;
    const pngDataUrl = cv.toDataURL('image/png');

    // Convert canvas to a simple SVG image tag
    const svgStr = `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><image href="${pngDataUrl}" x="0" y="0" width="60" height="60"/></svg>`;

    const newSymbol = {
      id: `custom-${Date.now()}`,
      name: symName.trim(),
      category,
      subcategory: 'custom',
      svg: svgStr,
      connectionPoints: [
        { x: 0,  y: 30, type: 'left'  },
        { x: 60, y: 30, type: 'right' },
        { x: 30, y: 0,  type: 'top'   },
        { x: 30, y: 60, type: 'bottom'},
      ],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      standards: ['Custom'],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await onSave(newSymbol);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="de-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="de-modal de-custom-creator">
        <div className="de-modal-header">
          <span className="de-modal-title">✏️ Create Custom Symbol</span>
          <button className="de-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="de-modal-body">

          {/* Drawing tools row */}
          <div className="de-creator-tools">
            {DRAW_TOOLS.map(t => (
              <button
                key={t.id}
                className={`de-creator-tool-btn${tool === t.id ? ' active' : ''}`}
                onClick={() => setTool(t.id)}
              >
                {t.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: 'var(--de-text-muted)' }}>Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
              <label style={{ fontSize: '11px', color: 'var(--de-text-muted)' }}>Width</label>
              <input type="range" min="1" max="8" value={lineW} onChange={e => setLineW(Number(e.target.value))}
                style={{ width: '60px' }} />
            </div>
          </div>

          {/* Canvas */}
          <div className="de-creator-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              style={{ width: '100%', maxWidth: '400px', display: 'block', margin: '0 auto', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <button className="de-creator-tool-btn" onClick={clearCanvas}>🗑️ Clear</button>
            <button className="de-creator-tool-btn" onClick={() => setShowSvgImport(s => !s)}>
              📥 Import SVG
            </button>
          </div>

          {showSvgImport && (
            <div className="de-form-group">
              <label className="de-form-label">Paste SVG code</label>
              <textarea
                className="de-form-input"
                rows={4}
                value={svgImport}
                onChange={e => setSvgImport(e.target.value)}
                placeholder='<svg viewBox="0 0 60 60" ...>...</svg>'
                style={{ fontFamily: 'monospace', fontSize: '11px' }}
              />
              <button className="de-creator-tool-btn" style={{ marginTop: '6px' }} onClick={importSvg}>
                Apply SVG
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="de-form-row">
            <div className="de-form-group">
              <label className="de-form-label">Symbol name *</label>
              <input className="de-form-input" value={symName} onChange={e => setName(e.target.value)}
                placeholder="e.g. Custom Contactor" />
            </div>
            <div className="de-form-group">
              <label className="de-form-label">Category</label>
              <select className="de-form-input" value={category} onChange={e => setCat(e.target.value)}>
                {CATEGORIES_FOR_SAVE.map(c => (
                  <option key={c} value={c}>{c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="de-form-group">
            <label className="de-form-label">Tags (comma-separated)</label>
            <input className="de-form-input" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="e.g. relay, custom, 3-phase" />
          </div>

        </div>
        <div className="de-modal-footer">
          <button className="de-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="de-btn-primary" onClick={handleSave} disabled={saving || !symName.trim()}>
            {saving ? 'Saving…' : '💾 Save Symbol'}
          </button>
        </div>
      </div>
    </div>
  );
}
