import React, { useRef, useState, useCallback, useEffect } from 'react';
import './DiagramEditor.css';
import Toolbar            from './Toolbar.jsx';
import SymbolLibrary      from './SymbolLibrary.jsx';
import Canvas             from './Canvas.jsx';
import PropertiesPanel    from './PropertiesPanel.jsx';
import ExportModal        from './ExportModal.jsx';
import CustomSymbolCreator from './CustomSymbolCreator.jsx';
import { setCustomSymbols } from './symbols/electricalSymbols.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function DiagramEditor() {
  const canvasRef = useRef(null);

  // Tool & canvas state
  const [activeTool,   setActiveTool]   = useState('select');
  const [zoom,         setZoom]         = useState(1);
  const [coords,       setCoords]       = useState({ x: 0, y: 0 });
  const [gridVisible,  setGridVisible]  = useState(true);
  const [snapEnabled,  setSnapEnabled]  = useState(true);
  const [selected,     setSelected]     = useState([]);
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);

  // Diagram metadata
  const [diagramName, setDiagramName] = useState('New Diagram');
  const [diagramId,   setDiagramId]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [lastSaved,   setLastSaved]   = useState(null);

  // Modals
  const [showExport,  setShowExport]  = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  // Custom symbols from DB
  useEffect(() => {
    fetch(`${API_BASE}/api/diagrams/custom-symbols`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCustomSymbols(data);
      })
      .catch(() => {});
  }, []);

  // Load last saved diagram if ID is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('diagram');
    if (!id) return;
    fetch(`${API_BASE}/api/diagrams/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.canvas) {
          setDiagramId(data._id);
          setDiagramName(data.name || 'Untitled');
          canvasRef.current?.loadJSON(data.canvas);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-save every 2 minutes
  useEffect(() => {
    const timer = setInterval(() => saveDiagram(true), 120000);
    return () => clearInterval(timer);
  }, [diagramName, diagramId]); // eslint-disable-line

  // Called by Canvas whenever history changes (saveHistory, undo, redo)
  const handleHistoryChange = useCallback(({ canUndo: u, canRedo: r }) => {
    setCanUndo(u);
    setCanRedo(r);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveDiagram = useCallback(async (silent = false) => {
    const cv = canvasRef.current;
    if (!cv) return;
    setSaving(true);
    try {
      const payload = {
        name: diagramName,
        canvas: cv.toJSON(),
      };
      const method = diagramId ? 'PUT' : 'POST';
      const url = diagramId
        ? `${API_BASE}/api/diagrams/${diagramId}`
        : `${API_BASE}/api/diagrams`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data._id) setDiagramId(data._id);
      setLastSaved(new Date());
      if (!silent) {
        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('diagram', data._id);
        window.history.replaceState({}, '', url);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }, [diagramName, diagramId]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDiagram();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveDiagram]);

  // ── Symbol drop (double-click from library) ───────────────────────────────
  const handleSymbolDrop = useCallback((symbol) => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.addSymbol(symbol);
  }, []);

  // ── Custom symbol save ────────────────────────────────────────────────────
  const handleSaveCustomSymbol = useCallback(async (sym) => {
    try {
      const res = await fetch(`${API_BASE}/api/diagrams/custom-symbols`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(sym),
      });
      const saved = await res.json();
      setCustomSymbols(prev => [...(prev || []), saved]);
    } catch (err) {
      console.error('Custom symbol save failed:', err);
    }
    setShowCreator(false);
  }, []);

  // ── Update object from props panel ────────────────────────────────────────
  const handleUpdateObject = useCallback((obj, updates) => {
    canvasRef.current?.updateSelected(obj, updates);
  }, []);

  const handleSelectionChange = useCallback((objs) => {
    setSelected(objs || []);
  }, []);

  // ── Undo/Redo wrappers ────────────────────────────────────────────────────
  const undo = () => { canvasRef.current?.undo(); };
  const redo = () => { canvasRef.current?.redo(); };

  return (
    <div className="de-root">
      {/* Header */}
      <div className="de-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="var(--de-gold)" strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="de-header-title">
          Diagram Editor
          <span>— MES Electrical</span>
        </span>
        {lastSaved && (
          <span style={{ fontSize: '11px', color: 'var(--de-text-muted)' }}>
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={t => setActiveTool(t)}
        zoom={zoom}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomReset={() => canvasRef.current?.zoomReset()}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectAll={() => canvasRef.current?.selectAll()}
        onDeleteSelected={() => canvasRef.current?.deleteSelected()}
        onGroup={() => canvasRef.current?.groupSelected()}
        onUngroup={() => canvasRef.current?.ungroupSelected()}
        onLock={() => canvasRef.current?.lockSelected()}
        onUnlock={() => canvasRef.current?.unlockSelected()}
        onAlignLeft={() => canvasRef.current?.align('left')}
        onAlignCenter={() => canvasRef.current?.align('center')}
        onAlignRight={() => canvasRef.current?.align('right')}
        onAlignTop={() => canvasRef.current?.align('top')}
        onAlignMiddle={() => canvasRef.current?.align('middle')}
        onAlignBottom={() => canvasRef.current?.align('bottom')}
        onSave={() => saveDiagram()}
        saving={saving}
        onExport={() => setShowExport(true)}
        onToggleGrid={() => setGridVisible(v => !v)}
        gridVisible={gridVisible}
        onToggleSnap={() => setSnapEnabled(v => !v)}
        snapEnabled={snapEnabled}
        diagramName={diagramName}
        onDiagramNameChange={setDiagramName}
      />

      {/* Main body */}
      <div className="de-body">
        {/* Left: Symbol Library */}
        <SymbolLibrary
          onDragStart={() => {}}
          onSymbolDrop={handleSymbolDrop}
          onAddCustom={() => setShowCreator(true)}
        />

        {/* Center: Canvas */}
        <Canvas
          ref={canvasRef}
          activeTool={activeTool}
          gridVisible={gridVisible}
          snapEnabled={snapEnabled}
          onSelectionChange={handleSelectionChange}
          onZoomChange={setZoom}
          onCoordsChange={(x, y) => setCoords({ x, y })}
          onToolUsed={setActiveTool}
          onHistoryChange={handleHistoryChange}
        />

        {/* Right: Properties */}
        <PropertiesPanel
          selectedObjects={selected}
          onUpdateObject={handleUpdateObject}
          onDeleteSelected={() => { canvasRef.current?.deleteSelected(); }}
          onDuplicate={() => { canvasRef.current?.duplicateSelected(); }}
          onLock={() => canvasRef.current?.lockSelected()}
          onUnlock={() => canvasRef.current?.unlockSelected()}
        />
      </div>

      {/* Status bar */}
      <div className="de-status-bar">
        <div className={`de-status-dot${saving ? ' saving' : ''}`} />
        <span>{saving ? 'Saving…' : diagramId ? 'Saved' : 'Unsaved'}</span>
        <span style={{ marginLeft: 'auto' }}>
          {coords.x}, {coords.y} px
        </span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>{selected.length > 0 ? `${selected.length} selected` : 'Nothing selected'}</span>
        <span>Grid: {gridVisible ? 'On' : 'Off'} | Snap: {snapEnabled ? 'On' : 'Off'}</span>
      </div>

      {/* Modals */}
      {showExport && (
        <ExportModal
          canvas={canvasRef.current?.getFabricCanvas()}
          diagramName={diagramName}
          onClose={() => setShowExport(false)}
        />
      )}
      {showCreator && (
        <CustomSymbolCreator
          onSave={handleSaveCustomSymbol}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  );
}
