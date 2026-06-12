import React, { useState, useEffect } from 'react';

function PropRow({ label, children }) {
  return (
    <div className="de-prop-row">
      <span className="de-prop-label">{label}</span>
      {children}
    </div>
  );
}

function ColorProp({ label, value, onChange }) {
  return (
    <div className="de-color-row">
      <span className="de-prop-label">{label}</span>
      <div className="de-color-swatch" style={{ background: value }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      <input
        className="de-prop-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1 }}
      />
    </div>
  );
}

export default function PropertiesPanel({ selectedObjects, onUpdateObject, onDeleteSelected, onDuplicate }) {
  const obj = selectedObjects && selectedObjects.length === 1 ? selectedObjects[0] : null;
  const multi = selectedObjects && selectedObjects.length > 1;

  const [label, setLabel]         = useState('');
  const [stroke, setStroke]       = useState('#1a1a2e');
  const [fill, setFill]           = useState('none');
  const [strokeW, setStrokeW]     = useState('2');
  const [fontSize, setFontSize]   = useState('14');
  const [opacity, setOpacity]     = useState('100');
  const [rotation, setRotation]   = useState('0');
  const [lockRatio, setLockRatio] = useState(true);
  const [posX, setPosX]           = useState('');
  const [posY, setPosY]           = useState('');
  const [width, setWidth]         = useState('');
  const [height, setHeight]       = useState('');

  useEffect(() => {
    if (!obj) return;
    setLabel(obj.label || '');
    setStroke(obj.stroke || '#1a1a2e');
    setFill(obj.fill || 'none');
    setStrokeW(String(obj.strokeWidth || 2));
    setFontSize(String(obj.fontSize || 14));
    setOpacity(String(Math.round((obj.opacity ?? 1) * 100)));
    setRotation(String(Math.round(obj.angle || 0)));
    setPosX(String(Math.round(obj.left || 0)));
    setPosY(String(Math.round(obj.top || 0)));
    setWidth(String(Math.round(obj.width * (obj.scaleX || 1))));
    setHeight(String(Math.round(obj.height * (obj.scaleY || 1))));
  }, [obj]);

  const commit = (updates) => {
    if (!obj || !onUpdateObject) return;
    onUpdateObject(obj, updates);
  };

  if (!selectedObjects || selectedObjects.length === 0) {
    return (
      <div className="de-props">
        <div className="de-props-header">Properties</div>
        <div className="de-props-scroll">
          <div className="de-props-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Select an object to edit its properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="de-props">
      <div className="de-props-header">
        Properties {multi && `(${selectedObjects.length} selected)`}
      </div>
      <div className="de-props-scroll">

        {obj && (
          <>
            {/* Label */}
            <div className="de-prop-section">
              <div className="de-prop-section-title">Label</div>
              <PropRow label="Text">
                <input
                  className="de-prop-input"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onBlur={() => commit({ label })}
                  placeholder="Enter label…"
                />
              </PropRow>
              <PropRow label="Font size">
                <input
                  className="de-prop-input"
                  type="number" min="6" max="72"
                  value={fontSize}
                  onChange={e => setFontSize(e.target.value)}
                  onBlur={() => commit({ fontSize: Number(fontSize) })}
                />
              </PropRow>
            </div>

            {/* Position & Size */}
            <div className="de-prop-section">
              <div className="de-prop-section-title">Position & Size</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <PropRow label="X">
                  <input className="de-prop-input" type="number" value={posX}
                    onChange={e => setPosX(e.target.value)}
                    onBlur={() => commit({ left: Number(posX) })} />
                </PropRow>
                <PropRow label="Y">
                  <input className="de-prop-input" type="number" value={posY}
                    onChange={e => setPosY(e.target.value)}
                    onBlur={() => commit({ top: Number(posY) })} />
                </PropRow>
                <PropRow label="W">
                  <input className="de-prop-input" type="number" value={width}
                    onChange={e => setWidth(e.target.value)}
                    onBlur={() => commit({ width: Number(width), scaleX: 1 })} />
                </PropRow>
                <PropRow label="H">
                  <input className="de-prop-input" type="number" value={height}
                    onChange={e => setHeight(e.target.value)}
                    onBlur={() => commit({ height: Number(height), scaleY: 1 })} />
                </PropRow>
              </div>
              <PropRow label="Rotation">
                <input className="de-prop-input" type="number" min="-360" max="360"
                  value={rotation}
                  onChange={e => setRotation(e.target.value)}
                  onBlur={() => commit({ angle: Number(rotation) })} />
              </PropRow>
            </div>

            {/* Appearance */}
            <div className="de-prop-section">
              <div className="de-prop-section-title">Appearance</div>
              <ColorProp label="Stroke" value={stroke} onChange={v => { setStroke(v); commit({ stroke: v }); }} />
              <ColorProp label="Fill"   value={fill === 'none' ? '#ffffff' : fill}
                onChange={v => { setFill(v); commit({ fill: v }); }} />
              <PropRow label="Line W">
                <input className="de-prop-input" type="number" min="0.5" max="10" step="0.5"
                  value={strokeW}
                  onChange={e => setStrokeW(e.target.value)}
                  onBlur={() => commit({ strokeWidth: Number(strokeW) })} />
              </PropRow>
              <PropRow label="Opacity">
                <input className="de-prop-input" type="range" min="10" max="100" step="5"
                  value={opacity}
                  onChange={e => { setOpacity(e.target.value); commit({ opacity: Number(e.target.value) / 100 }); }}
                  style={{ padding: 0 }}
                />
                <span style={{ fontSize: '11px', color: 'var(--de-text-muted)', marginLeft: '4px', minWidth: '28px' }}>
                  {opacity}%
                </span>
              </PropRow>
            </div>

            {/* Line style for wires */}
            {obj.type === 'line' || obj.isWire ? (
              <div className="de-prop-section">
                <div className="de-prop-section-title">Wire</div>
                <PropRow label="Style">
                  <select className="de-prop-select"
                    value={obj.strokeDashArray ? 'dashed' : 'solid'}
                    onChange={e => commit({ strokeDashArray: e.target.value === 'dashed' ? [6, 4] : null })}>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                  </select>
                </PropRow>
              </div>
            ) : null}

            {/* Standards tag */}
            {obj.standards && obj.standards.length > 0 && (
              <div className="de-prop-section">
                <div className="de-prop-section-title">Standards</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {obj.standards.map(s => <span key={s} className="de-tag">{s}</span>)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="de-prop-section">
          <div className="de-prop-section-title">Actions</div>
          <button className="de-prop-btn" onClick={onDuplicate}>Duplicate</button>
          <button className="de-prop-btn" onClick={() => commit({ angle: ((obj?.angle || 0) + 90) % 360 })}>
            Rotate 90°
          </button>
          <button className="de-prop-btn" onClick={() => commit({ flipX: !obj?.flipX })}>
            Flip Horizontal
          </button>
          <button className="de-prop-btn" onClick={() => commit({ flipY: !obj?.flipY })}>
            Flip Vertical
          </button>
          <button className="de-prop-btn danger" onClick={onDeleteSelected}>Delete</button>
        </div>

      </div>
    </div>
  );
}
