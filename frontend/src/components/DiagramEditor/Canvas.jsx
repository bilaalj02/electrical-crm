import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Canvas as FabricCanvas,
  Line, Rect, Circle, IText, Group, ActiveSelection,
  loadSVGFromString,
  util,
} from 'fabric';
import { getSymbolById } from './symbols/electricalSymbols.js';

const GRID_SIZE = 20;

const CanvasComponent = forwardRef(function CanvasComponent(
  { activeTool, gridVisible, snapEnabled, onSelectionChange, onZoomChange, onCoordsChange },
  ref
) {
  const containerRef = useRef(null);
  const canvasElRef  = useRef(null);
  const fabricRef    = useRef(null);

  // Wire drawing state
  const wireState = useRef({ drawing: false, line: null, startX: 0, startY: 0 });

  // History
  const history     = useRef([]);
  const historyIdx  = useRef(-1);
  const skipHistory = useRef(false);

  // Clipboard
  const clipboard = useRef(null);

  // Keep latest tool/snap refs so event handlers don't go stale
  const activeToolRef  = useRef(activeTool);
  const snapEnabledRef = useRef(snapEnabled);
  useEffect(() => { activeToolRef.current  = activeTool;  }, [activeTool]);
  useEffect(() => { snapEnabledRef.current = snapEnabled; }, [snapEnabled]);

  // ── Snap helper ────────────────────────────────────────────────────────
  const snap = (val) => {
    if (!snapEnabledRef.current) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  };

  // ── History ────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv || skipHistory.current) return;
    const json = JSON.stringify(cv.toDatalessJSON(['symbolId', 'isWire', 'label', 'standards', '_isGrid']));
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push(json);
    historyIdx.current = history.current.length - 1;
  }, []);

  // ── Grid ───────────────────────────────────────────────────────────────
  const drawGrid = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    const w = cv.width;
    const h = cv.height;

    cv.getObjects().filter(o => o._isGrid).forEach(o => cv.remove(o));

    if (!gridVisible) { cv.renderAll(); return; }

    for (let x = 0; x <= w; x += GRID_SIZE) {
      const l = new Line([x, 0, x, h], {
        stroke: '#d0d4dc', strokeWidth: 0.5, selectable: false,
        evented: false, excludeFromExport: true,
      });
      l._isGrid = true;
      cv.add(l);
      cv.sendObjectToBack(l);
    }
    for (let y = 0; y <= h; y += GRID_SIZE) {
      const l = new Line([0, y, w, y], {
        stroke: '#d0d4dc', strokeWidth: 0.5, selectable: false,
        evented: false, excludeFromExport: true,
      });
      l._isGrid = true;
      cv.add(l);
      cv.sendObjectToBack(l);
    }
    cv.renderAll();
  }, [gridVisible]);

  useEffect(() => { drawGrid(); }, [gridVisible, drawGrid]);

  // ── Init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || fabricRef.current) return;

    const { width, height } = container.getBoundingClientRect();

    const canvas = new FabricCanvas(canvasElRef.current, {
      width,
      height,
      selection: true,
      backgroundColor: '#f0f2f5',
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // Resize observer
    const ro = new ResizeObserver(() => {
      const { width: w, height: h } = container.getBoundingClientRect();
      canvas.setDimensions({ width: w, height: h });
      drawGrid();
    });
    ro.observe(container);

    drawGrid();

    // ── Mouse wheel zoom ────────────────────────────────────────────────
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let z = canvas.getZoom();
      z *= 0.999 ** delta;
      z = Math.min(Math.max(z, 0.1), 10);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      onZoomChange && onZoomChange(z);
    });

    // ── Mouse down ──────────────────────────────────────────────────────
    canvas.on('mouse:down', (opt) => {
      const tool = activeToolRef.current;
      const ptr  = canvas.getScenePoint(opt.e);
      const x = snap(ptr.x);
      const y = snap(ptr.y);
      if (onCoordsChange) onCoordsChange(Math.round(ptr.x), Math.round(ptr.y));

      if (tool === 'wire' || tool === 'bus') {
        const ws = wireState.current;
        if (!ws.drawing) {
          const line = new Line([x, y, x, y], {
            stroke: tool === 'bus' ? '#0050a0' : '#1a1a2e',
            strokeWidth: tool === 'bus' ? 4 : 2,
            selectable: false, evented: false,
          });
          line.isWire = true;
          canvas.add(line);
          ws.line = line; ws.drawing = true; ws.startX = x; ws.startY = y;
          canvas.selection = false;
        } else {
          // Finish current segment, start next
          const prevLine = ws.line;
          prevLine.set({ x2: x, y2: y, selectable: true, evented: true });
          ws.startX = x; ws.startY = y;

          const nextLine = new Line([x, y, x, y], {
            stroke: tool === 'bus' ? '#0050a0' : '#1a1a2e',
            strokeWidth: tool === 'bus' ? 4 : 2,
            selectable: false, evented: false,
          });
          nextLine.isWire = true;
          canvas.add(nextLine);
          ws.line = nextLine;
        }
        canvas.renderAll();

      } else if (tool === 'rect') {
        const r = new Rect({ left: x, top: y, width: 1, height: 1, fill: 'none', stroke: '#1a1a2e', strokeWidth: 2 });
        canvas.add(r);
        wireState.current = { drawing: true, line: r, startX: x, startY: y };
        canvas.selection = false;

      } else if (tool === 'circle') {
        const c = new Circle({ left: x, top: y, radius: 1, fill: 'none', stroke: '#1a1a2e', strokeWidth: 2 });
        canvas.add(c);
        wireState.current = { drawing: true, line: c, startX: x, startY: y };
        canvas.selection = false;

      } else if (tool === 'line') {
        const l = new Line([x, y, x, y], { stroke: '#1a1a2e', strokeWidth: 2 });
        canvas.add(l);
        wireState.current = { drawing: true, line: l, startX: x, startY: y };
        canvas.selection = false;
      }
    });

    // ── Mouse move ──────────────────────────────────────────────────────
    canvas.on('mouse:move', (opt) => {
      const ptr = canvas.getScenePoint(opt.e);
      const x = snap(ptr.x);
      const y = snap(ptr.y);
      if (onCoordsChange) onCoordsChange(Math.round(ptr.x), Math.round(ptr.y));

      const tool = activeToolRef.current;
      const ws   = wireState.current;
      if (!ws.drawing || !ws.line) return;

      if (tool === 'wire' || tool === 'bus') {
        ws.line.set({ x2: x, y2: y });
      } else if (tool === 'rect') {
        const dx = x - ws.startX;
        const dy = y - ws.startY;
        ws.line.set({
          left: dx < 0 ? x : ws.startX,
          top:  dy < 0 ? y : ws.startY,
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
      } else if (tool === 'circle') {
        const dx = x - ws.startX;
        const dy = y - ws.startY;
        const r  = Math.sqrt(dx * dx + dy * dy) / 2;
        ws.line.set({
          radius: Math.max(r, 1),
          left: Math.min(ws.startX, x),
          top:  Math.min(ws.startY, y),
        });
      } else if (tool === 'line') {
        ws.line.set({ x2: x, y2: y });
      }
      canvas.renderAll();
    });

    // ── Mouse up ────────────────────────────────────────────────────────
    canvas.on('mouse:up', (opt) => {
      const tool = activeToolRef.current;
      const ws   = wireState.current;

      if (tool !== 'wire' && tool !== 'bus') {
        if (ws.drawing) {
          ws.line && ws.line.setCoords();
          wireState.current = { drawing: false, line: null, startX: 0, startY: 0 };
          canvas.selection = true;
          saveHistory();
        }
      }

      if (tool === 'text' && !ws.drawing) {
        const ptr = canvas.getScenePoint(opt.e);
        const itext = new IText('Label', {
          left: snap(ptr.x), top: snap(ptr.y),
          fontSize: 14, fill: '#1a1a2e',
          fontFamily: 'Inter, Segoe UI, sans-serif',
        });
        canvas.add(itext);
        canvas.setActiveObject(itext);
        itext.enterEditing();
        itext.selectAll();
        saveHistory();
      }
    });

    // Double-click ends wire
    canvas.on('mouse:dblclick', () => {
      const ws = wireState.current;
      if ((activeToolRef.current === 'wire' || activeToolRef.current === 'bus') && ws.drawing) {
        if (ws.line) canvas.remove(ws.line);
        wireState.current = { drawing: false, line: null, startX: 0, startY: 0 };
        canvas.selection = true;
        saveHistory();
      }
    });

    // Selection events
    canvas.on('selection:created', e => onSelectionChange && onSelectionChange(canvas.getActiveObjects()));
    canvas.on('selection:updated', e => onSelectionChange && onSelectionChange(canvas.getActiveObjects()));
    canvas.on('selection:cleared', ()  => onSelectionChange && onSelectionChange([]));
    canvas.on('object:modified',  () => saveHistory());

    // Keyboard
    const onKey = (e) => {
      const cv = fabricRef.current;
      if (!cv) return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undoImpl();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault(); redoImpl();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault(); selectAllImpl();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copyImpl();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteImpl();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault(); duplicateImpl();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteImpl();
      } else if (e.key === 'Escape') {
        const ws = wireState.current;
        if (ws.drawing) {
          if (ws.line) cv.remove(ws.line);
          wireState.current = { drawing: false, line: null, startX: 0, startY: 0 };
          cv.selection = true;
        }
        cv.discardActiveObject();
        cv.renderAll();
      }
    };
    window.addEventListener('keydown', onKey);

    saveHistory();

    return () => {
      ro.disconnect();
      canvas.dispose();
      fabricRef.current = null;
      window.removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line

  // ── Internal action implementations ──────────────────────────────────
  const undoImpl = () => {
    const cv = fabricRef.current;
    if (!cv || historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    skipHistory.current = true;
    cv.loadFromJSON(JSON.parse(history.current[historyIdx.current])).then(() => {
      skipHistory.current = false;
      drawGrid();
      onZoomChange && onZoomChange(cv.getZoom());
    });
  };

  const redoImpl = () => {
    const cv = fabricRef.current;
    if (!cv || historyIdx.current >= history.current.length - 1) return;
    historyIdx.current += 1;
    skipHistory.current = true;
    cv.loadFromJSON(JSON.parse(history.current[historyIdx.current])).then(() => {
      skipHistory.current = false;
      drawGrid();
      onZoomChange && onZoomChange(cv.getZoom());
    });
  };

  const deleteImpl = () => {
    const cv = fabricRef.current;
    if (!cv) return;
    const objs = cv.getActiveObjects();
    if (!objs.length) return;
    objs.forEach(o => cv.remove(o));
    cv.discardActiveObject();
    cv.renderAll();
    saveHistory();
  };

  const duplicateImpl = () => {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObject();
    if (!active) return;
    active.clone().then(cloned => {
      cloned.set({ left: active.left + 20, top: active.top + 20 });
      cv.add(cloned);
      cv.setActiveObject(cloned);
      cv.renderAll();
      saveHistory();
    });
  };

  const selectAllImpl = () => {
    const cv = fabricRef.current;
    if (!cv) return;
    const objs = cv.getObjects().filter(o => !o._isGrid && o.selectable !== false);
    const sel = new ActiveSelection(objs, { canvas: cv });
    cv.setActiveObject(sel);
    cv.requestRenderAll();
  };

  const copyImpl = () => {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObject();
    if (!active) return;
    active.clone().then(c => { clipboard.current = c; });
  };

  const pasteImpl = () => {
    const cv = fabricRef.current;
    if (!cv || !clipboard.current) return;
    clipboard.current.clone().then(cloned => {
      cv.discardActiveObject();
      cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = cv;
        cloned.forEachObject(obj => cv.add(obj));
      } else {
        cv.add(cloned);
      }
      cv.setActiveObject(cloned);
      cv.requestRenderAll();
      saveHistory();
    });
    clipboard.current.set({ left: clipboard.current.left + 10, top: clipboard.current.top + 10 });
  };

  // ── Public API via ref ────────────────────────────────────────────────
  const addSymbol = useCallback((symbol, x, y) => {
    const cv = fabricRef.current;
    if (!cv) return;
    loadSVGFromString(symbol.svg).then(({ objects, options }) => {
      // Filter out nulls (fabric v7 can return null for unsupported elements)
      const validObjects = objects.filter(Boolean);
      if (!validObjects.length) return;

      const group = util.groupSVGElements(validObjects, options);
      const scaleVal = 60 / Math.max(group.width || 60, group.height || 60);
      group.scale(scaleVal);

      const sx = snap(x !== undefined ? x : cv.width / 2);
      const sy = snap(y !== undefined ? y : cv.height / 2);
      group.set({ left: sx - 30, top: sy - 30, originX: 'left', originY: 'top' });
      group.symbolId  = symbol.id;
      group.label     = symbol.name;
      group.standards = symbol.standards || [];

      cv.add(group);
      cv.setActiveObject(group);
      cv.renderAll();
      saveHistory();
    }).catch(err => {
      console.error('addSymbol failed:', err);
    });
  }, [saveHistory]); // eslint-disable-line

  const toJSON = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return '{}';
    return JSON.stringify(cv.toDatalessJSON(['symbolId', 'isWire', 'label', 'standards']));
  }, []);

  const loadJSON = useCallback((json) => {
    const cv = fabricRef.current;
    if (!cv) return;
    skipHistory.current = true;
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    cv.loadFromJSON(data).then(() => {
      cv.renderAll();
      skipHistory.current = false;
      drawGrid();
      saveHistory();
    });
  }, [drawGrid, saveHistory]);

  const updateSelected = useCallback((obj, updates) => {
    const cv = fabricRef.current;
    if (!cv) return;
    obj.set(updates);
    obj.setCoords();
    cv.renderAll();
    saveHistory();
  }, [saveHistory]);

  const getFabricCanvas = useCallback(() => fabricRef.current, []);

  const zoomIn = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    const z = Math.min(cv.getZoom() * 1.2, 10);
    cv.zoomToPoint({ x: cv.width / 2, y: cv.height / 2 }, z);
    onZoomChange && onZoomChange(z);
  }, [onZoomChange]);

  const zoomOut = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    const z = Math.max(cv.getZoom() / 1.2, 0.1);
    cv.zoomToPoint({ x: cv.width / 2, y: cv.height / 2 }, z);
    onZoomChange && onZoomChange(z);
  }, [onZoomChange]);

  const zoomReset = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    cv.setViewportTransform([1, 0, 0, 1, 0, 0]);
    onZoomChange && onZoomChange(1);
    cv.renderAll();
  }, [onZoomChange]);

  const groupSelected = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    active.toGroup();
    cv.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const ungroupSelected = useCallback(() => {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObject();
    if (!active || active.type !== 'group') return;
    active.toActiveSelection();
    cv.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const align = useCallback((direction) => {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    const objs = active.getObjects();
    const bb   = active.getBoundingRect();
    objs.forEach(o => {
      if (direction === 'left')   o.set({ left: bb.left });
      if (direction === 'right')  o.set({ left: bb.left + bb.width - o.getScaledWidth() });
      if (direction === 'center') o.set({ left: bb.left + (bb.width - o.getScaledWidth()) / 2 });
      if (direction === 'top')    o.set({ top:  bb.top });
      if (direction === 'bottom') o.set({ top:  bb.top + bb.height - o.getScaledHeight() });
      if (direction === 'middle') o.set({ top:  bb.top + (bb.height - o.getScaledHeight()) / 2 });
      o.setCoords();
    });
    cv.renderAll();
    saveHistory();
  }, [saveHistory]);

  useImperativeHandle(ref, () => ({
    addSymbol,
    undo:            undoImpl,
    redo:            redoImpl,
    deleteSelected:  deleteImpl,
    duplicateSelected: duplicateImpl,
    selectAll:       selectAllImpl,
    groupSelected,
    ungroupSelected,
    zoomIn, zoomOut, zoomReset,
    updateSelected,
    toJSON, loadJSON,
    getFabricCanvas,
    align,
    canUndo: () => historyIdx.current > 0,
    canRedo: () => historyIdx.current < history.current.length - 1,
  }));

  // ── Drag & Drop ────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  const handleDrop = (e) => {
    e.preventDefault();
    const symbolId = e.dataTransfer.getData('symbol-id');
    if (!symbolId) return;
    const sym = getSymbolById(symbolId);
    if (!sym) return;
    const cv = fabricRef.current;
    if (!cv) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const vpt = cv.viewportTransform;
    const x = (clientX - vpt[4]) / vpt[0];
    const y = (clientY - vpt[5]) / vpt[3];
    addSymbol(sym, x, y);
  };

  return (
    <div
      ref={containerRef}
      className="de-canvas-wrap"
      style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
});

export default CanvasComponent;
