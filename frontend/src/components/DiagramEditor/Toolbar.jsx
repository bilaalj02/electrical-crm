import React from 'react';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// Icon-only button — label lives in tooltip only
const Btn = ({ icon, tip, onClick, active, danger, success, disabled, children }) => (
  <button
    className={`de-tool-btn${active ? ' active' : ''}${danger ? ' danger' : ''}${success ? ' success' : ''}`}
    onClick={onClick}
    title={tip}
    disabled={disabled}
  >
    {icon ? <Icon d={icon} /> : children}
  </button>
);

// Labeled group cluster
const Group = ({ label, children }) => (
  <div className="de-tool-group">
    <div className="de-tool-group-inner">{children}</div>
    <span className="de-tool-group-label">{label}</span>
  </div>
);

const DRAW_TOOLS = [
  { id: 'select', icon: 'M5 3l14 9-7 2-2 7z',                                              tip: 'Select / Move (V)' },
  { id: 'wire',   icon: 'M3 12h18M12 3v18',                                                tip: 'Draw Wire (W)' },
  { id: 'bus',    icon: 'M3 8h18M3 16h18',                                                 tip: 'Draw Bus (B)' },
  { id: 'text',   icon: 'M4 7V4h16v3M9 20h6M12 4v16',                                     tip: 'Add Text (T)' },
  { id: 'line',   icon: 'M5 19L19 5',                                                       tip: 'Draw Line (L)' },
  { id: 'rect',   icon: 'M3 3h18v18H3z',                                                   tip: 'Draw Rectangle (R)' },
  { id: 'circle', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',                       tip: 'Draw Circle (C)' },
  { id: 'note',   icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',   tip: 'Add Note (N)' },
];

export default function Toolbar({
  activeTool, onToolChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  onUndo, onRedo, canUndo, canRedo,
  onSelectAll, onDeleteSelected, onGroup, onUngroup,
  onLock, onUnlock,
  onAlignLeft, onAlignCenter, onAlignRight, onAlignTop, onAlignMiddle, onAlignBottom,
  onSave, saving,
  onExport,
  onToggleGrid, gridVisible,
  onToggleSnap, snapEnabled,
  diagramName, onDiagramNameChange,
}) {
  return (
    <div className="de-toolbar">

      {/* ── Diagram name ── */}
      <input
        className="de-diagram-name-input"
        value={diagramName}
        onChange={e => onDiagramNameChange(e.target.value)}
        placeholder="Diagram name…"
      />

      <div className="de-toolbar-divider" />

      {/* ── DRAW ── */}
      <Group label="Draw">
        {DRAW_TOOLS.map(t => (
          <Btn key={t.id} icon={t.icon} tip={t.tip}
            active={activeTool === t.id}
            onClick={() => onToolChange(t.id)} />
        ))}
      </Group>

      <div className="de-toolbar-divider" />

      {/* ── EDIT ── */}
      <Group label="Edit">
        <Btn tip="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}
          icon="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        <Btn tip="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo}
          icon="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        <div className="de-tool-mini-sep" />
        <Btn tip="Select All (Ctrl+A)" onClick={onSelectAll}
          icon="M3 3h18v18H3z" />
        <Btn tip="Group (Ctrl+G)" onClick={onGroup}
          icon="M2 7l4-4h12l4 4v10l-4 4H6l-4-4z" />
        <Btn tip="Ungroup" onClick={onUngroup}
          icon="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM3 15h6v6H3z" />
        <div className="de-tool-mini-sep" />
        <Btn tip="Lock selection — prevents moving/resizing/rotating" onClick={onLock}
          icon="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />
        <Btn tip="Unlock selection" onClick={onUnlock}
          icon="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1" />
        <Btn tip="Delete (Del)" onClick={onDeleteSelected} danger
          icon="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
      </Group>

      <div className="de-toolbar-divider" />

      {/* ── ARRANGE ── */}
      <Group label="Arrange">
        <Btn tip="Align Left"     onClick={onAlignLeft}   icon="M4 6h16M4 12h10M4 18h14" />
        <Btn tip="Align Center"   onClick={onAlignCenter} icon="M4 6h16M7 12h10M5 18h14" />
        <Btn tip="Align Right"    onClick={onAlignRight}  icon="M4 6h16M10 12h10M6 18h14" />
        <Btn tip="Align Top"      onClick={onAlignTop}    icon="M6 4h12M12 4v16M3 8h6M3 16h6" />
        <Btn tip="Align Middle"   onClick={onAlignMiddle} icon="M3 12h18M8 7v10M16 7v10" />
        <Btn tip="Align Bottom"   onClick={onAlignBottom} icon="M6 20h12M12 4v16M3 16h6M15 16h6" />
      </Group>

      <div className="de-toolbar-divider" />

      {/* ── VIEW ── */}
      <Group label="View">
        <Btn tip="Toggle Grid" onClick={onToggleGrid} active={gridVisible}
          icon="M3 3h18M3 9h18M3 15h18M9 3v18M15 3v18" />
        <Btn tip="Toggle Snap" onClick={onToggleSnap} active={snapEnabled}
          icon="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <div className="de-tool-mini-sep" />
        <Btn tip="Zoom Out (-)" onClick={onZoomOut}
          icon="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM8 11h6" />
        <span className="de-zoom-display">{Math.round(zoom * 100)}%</span>
        <Btn tip="Zoom In (+)" onClick={onZoomIn}
          icon="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM11 8v6M8 11h6" />
        <Btn tip="Reset Zoom (0)" onClick={onZoomReset}
          icon="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 12h8M12 8v8" />
      </Group>

      <div className="de-toolbar-divider" />

      {/* ── FILE ── */}
      <Group label="File">
        <Btn tip="Save (Ctrl+S)" onClick={onSave} success>
          <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />
          {saving && <span className="de-btn-saving-dot" />}
        </Btn>
        <Btn tip="Export (PDF / PNG / SVG)" onClick={onExport}
          icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </Group>

    </div>
  );
}
