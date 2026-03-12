import React from 'react';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TOOLS = [
  { id: 'select',    label: 'Select',    icon: 'M5 3l14 9-7 2-2 7z', tip: 'Select / Move (V)' },
  { id: 'wire',      label: 'Wire',      icon: 'M3 12h18M12 3v18',    tip: 'Draw Wire (W)' },
  { id: 'bus',       label: 'Bus',       icon: 'M3 8h18M3 16h18',     tip: 'Draw Bus (B)' },
  { id: 'text',      label: 'Text',      icon: 'M4 7V4h16v3M9 20h6M12 4v16', tip: 'Add Text (T)' },
  { id: 'line',      label: 'Line',      icon: 'M5 19L19 5',          tip: 'Draw Line (L)' },
  { id: 'rect',      label: 'Rect',      icon: 'M3 3h18v18H3z',       tip: 'Draw Rectangle (R)' },
  { id: 'circle',    label: 'Circle',    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', tip: 'Draw Circle (C)' },
  { id: 'note',      label: 'Note',      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', tip: 'Add Note (N)' },
];

export default function Toolbar({
  activeTool, onToolChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  onUndo, onRedo, canUndo, canRedo,
  onSelectAll, onDeleteSelected, onGroup, onUngroup,
  onAlignLeft, onAlignCenter, onAlignRight, onAlignTop, onAlignMiddle, onAlignBottom,
  onSave, saving,
  onExport,
  onToggleGrid, gridVisible,
  onToggleSnap, snapEnabled,
  diagramName, onDiagramNameChange,
}) {
  return (
    <div className="de-toolbar">
      {/* Diagram name */}
      <input
        className="de-diagram-name-input"
        value={diagramName}
        onChange={e => onDiagramNameChange(e.target.value)}
        placeholder="Diagram name…"
      />

      <div className="de-toolbar-sep" />

      {/* Draw tools */}
      {TOOLS.map(t => (
        <button
          key={t.id}
          className={`de-tool-btn${activeTool === t.id ? ' active' : ''}`}
          onClick={() => onToolChange(t.id)}
          title={t.tip}
        >
          <Icon d={t.icon} />
          <span className="de-tool-label">{t.label}</span>
        </button>
      ))}

      <div className="de-toolbar-sep" />

      {/* Undo / Redo */}
      <button className="de-tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Icon d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        <span className="de-tool-label">Undo</span>
      </button>
      <button className="de-tool-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Icon d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        <span className="de-tool-label">Redo</span>
      </button>

      <div className="de-toolbar-sep" />

      {/* Selection ops */}
      <button className="de-tool-btn" onClick={onSelectAll} title="Select All (Ctrl+A)">
        <Icon d="M3 3h18v18H3z" />
        <span className="de-tool-label">All</span>
      </button>
      <button className="de-tool-btn" onClick={onGroup} title="Group (Ctrl+G)">
        <Icon d="M2 7l4-4h12l4 4v10l-4 4H6l-4-4z" />
        <span className="de-tool-label">Group</span>
      </button>
      <button className="de-tool-btn" onClick={onUngroup} title="Ungroup (Ctrl+Shift+G)">
        <Icon d="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM3 15h6v6H3z" />
        <span className="de-tool-label">Split</span>
      </button>
      <button className="de-tool-btn danger" onClick={onDeleteSelected} title="Delete (Del)">
        <Icon d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        <span className="de-tool-label">Delete</span>
      </button>

      <div className="de-toolbar-sep" />

      {/* Align */}
      <button className="de-tool-btn" onClick={onAlignLeft}   title="Align Left">
        <Icon d="M4 6h16M4 12h10M4 18h14" />
        <span className="de-tool-label">←</span>
      </button>
      <button className="de-tool-btn" onClick={onAlignCenter} title="Align Center H">
        <Icon d="M4 6h16M7 12h10M5 18h14" />
        <span className="de-tool-label">↔</span>
      </button>
      <button className="de-tool-btn" onClick={onAlignRight}  title="Align Right">
        <Icon d="M4 6h16M10 12h10M6 18h14" />
        <span className="de-tool-label">→</span>
      </button>

      <div className="de-toolbar-sep" />

      {/* Grid / Snap */}
      <button
        className={`de-tool-btn${gridVisible ? ' active' : ''}`}
        onClick={onToggleGrid}
        title="Toggle Grid"
      >
        <Icon d="M3 3h18M3 9h18M3 15h18M9 3v18M15 3v18" />
        <span className="de-tool-label">Grid</span>
      </button>
      <button
        className={`de-tool-btn${snapEnabled ? ' active' : ''}`}
        onClick={onToggleSnap}
        title="Toggle Snap to Grid"
      >
        <Icon d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <span className="de-tool-label">Snap</span>
      </button>

      <div className="de-toolbar-sep" />

      {/* Zoom */}
      <button className="de-tool-btn" onClick={onZoomOut} title="Zoom Out (-)">
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM8 11h6" />
        <span className="de-tool-label">−</span>
      </button>
      <span className="de-zoom-display">{Math.round(zoom * 100)}%</span>
      <button className="de-tool-btn" onClick={onZoomIn} title="Zoom In (+)">
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM11 8v6M8 11h6" />
        <span className="de-tool-label">+</span>
      </button>
      <button className="de-tool-btn" onClick={onZoomReset} title="Reset Zoom (0)">
        <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 12h8M12 8v8" />
        <span className="de-tool-label">1:1</span>
      </button>

      <div className="de-toolbar-sep" />

      {/* Save / Export */}
      <button className={`de-tool-btn success`} onClick={onSave} title="Save (Ctrl+S)">
        <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />
        <span className="de-tool-label">{saving ? '…' : 'Save'}</span>
      </button>
      <button className="de-tool-btn" onClick={onExport} title="Export Diagram">
        <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        <span className="de-tool-label">Export</span>
      </button>
    </div>
  );
}
