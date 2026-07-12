import { useState, useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  {
    target: 'dt-name',
    title: 'Name Your Diagram',
    body: 'Click this field to rename your diagram. Give it a clear name like "Unit 4 Panel Schedule" so you can find it later.',
    placement: 'bottom',
  },
  {
    target: 'dt-draw',
    title: 'Drawing Tools',
    body: 'Your core tools: Select (V), Wire (W), Bus (B), Text (T), Line (L), Rectangle (R), Circle (C), Note (N). Keyboard shortcuts work while the canvas is focused.',
    placement: 'bottom',
  },
  {
    target: 'dt-edit',
    title: 'Edit Tools',
    body: 'Undo / Redo changes, select everything, group elements together, lock them in place, or delete selected items with the trash button.',
    placement: 'bottom',
  },
  {
    target: 'dt-arrange',
    title: 'Arrange & Align',
    body: 'Select multiple elements then use these to snap them into alignment — left, center, right, top, middle, or bottom.',
    placement: 'bottom',
  },
  {
    target: 'dt-view',
    title: 'View Controls',
    body: 'Toggle the grid on/off, enable snap-to-grid for precise placement, and zoom in or out. Scroll wheel also zooms on the canvas.',
    placement: 'bottom',
  },
  {
    target: 'dt-file',
    title: 'Save & Export',
    body: 'Hit Save (or Ctrl+S) to store your diagram. Export lets you download it as PDF, PNG, or SVG — ready to print or share.',
    placement: 'bottom',
  },
  {
    target: 'dt-library',
    title: 'Symbol Library',
    body: 'Browse electrical symbols by category — breakers, panels, outlets, lighting, and more. Drag a symbol onto the canvas or double-click to place it at the center.',
    placement: 'right',
  },
  {
    target: 'dt-canvas',
    title: 'The Canvas',
    body: 'Click to select elements, drag to move them. With the Wire tool active, click to start a wire and click again to anchor each node. Scroll to zoom, middle-click to pan.',
    placement: 'top',
  },
];

function getKey(userId) {
  return `diagram_tour_complete_${userId}`;
}

export default function DiagramTour({ onRestart }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | welcome | tour | done
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem(getKey(user._id || user.id))) {
      // Small delay so the editor finishes rendering before we measure
      setTimeout(() => setPhase('welcome'), 500);
    }
  }, [user]);

  // Allow parent to trigger a restart
  useEffect(() => {
    if (onRestart) {
      onRestart.current = () => {
        if (user) localStorage.removeItem(getKey(user._id || user.id));
        setStepIndex(0);
        setPhase('welcome');
      };
    }
  }, [onRestart, user]);

  const dismiss = useCallback(() => {
    if (user) localStorage.setItem(getKey(user._id || user.id), '1');
    setPhase('done');
    setTargetRect(null);
  }, [user]);

  const measureTarget = useCallback((target) => {
    const el = document.querySelector(`[data-diagram-tour="${target}"]`);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    if (phase !== 'tour') return;
    const step = STEPS[stepIndex];
    if (!step) return;
    const measure = () => measureTarget(step.target);
    measure();
    const timers = [setTimeout(measure, 150), setTimeout(measure, 400)];
    window.addEventListener('resize', measure);
    return () => { timers.forEach(clearTimeout); window.removeEventListener('resize', measure); };
  }, [phase, stepIndex, measureTarget]);

  const startTour = () => { setStepIndex(0); setPhase('tour'); };

  const goNext = () => {
    const next = stepIndex + 1;
    if (next >= STEPS.length) { dismiss(); return; }
    setStepIndex(next);
  };

  const goBack = () => {
    const prev = stepIndex - 1;
    if (prev < 0) return;
    setStepIndex(prev);
  };

  if (phase === 'idle' || phase === 'done') return null;

  // ── WELCOME ──
  if (phase === 'welcome') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: '#1a1a2e', border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: '14px', padding: '36px 40px', maxWidth: '420px', width: '90%',
          textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          animation: 'onboard-pop 0.25s ease',
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9a84c, #8b6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', fontSize: '26px',
          }}>⚡</div>
          <h2 style={{ color: '#f0e6c8', fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>
            Welcome to the Diagram Editor
          </h2>
          <p style={{ color: '#8b8fa8', fontSize: '13px', lineHeight: 1.6, margin: '0 0 26px' }}>
            Create professional electrical diagrams, panel schedules, and wiring layouts.
            Want a quick tour of all the tools?
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={dismiss} style={{
              background: 'transparent', color: '#6b7280', border: '1px solid #374151',
              borderRadius: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer',
            }}>Skip for now</button>
            <button onClick={startTour} style={{
              background: '#c9a84c', color: '#111', border: 'none',
              borderRadius: '8px', padding: '9px 22px', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}>Show me around →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── TOUR ──
  const step = STEPS[stepIndex];
  if (!step) return null;

  const TOOLTIP_W = 290;
  const TOOLTIP_H = 190;
  const PAD = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let tooltipStyle = {};
  let arrowClass = '';

  if (targetRect) {
    const { top, left, width, height } = targetRect;
    const p = step.placement;

    if (p === 'bottom') {
      let tl = left + width / 2 - TOOLTIP_W / 2;
      tl = Math.max(PAD, Math.min(vw - TOOLTIP_W - PAD, tl));
      tooltipStyle = { top: top + height + PAD, left: tl };
      arrowClass = 'arrow-top';
    } else if (p === 'top') {
      let tl = left + width / 2 - TOOLTIP_W / 2;
      tl = Math.max(PAD, Math.min(vw - TOOLTIP_W - PAD, tl));
      tooltipStyle = { top: Math.max(PAD, top - TOOLTIP_H - PAD), left: tl };
      arrowClass = 'arrow-bottom';
    } else if (p === 'right') {
      let tt = top + height / 2 - TOOLTIP_H / 2;
      tt = Math.max(PAD, Math.min(vh - TOOLTIP_H - PAD, tt));
      let tl = left + width + PAD;
      if (tl + TOOLTIP_W > vw - PAD) { tl = left - TOOLTIP_W - PAD; arrowClass = 'arrow-right'; }
      else arrowClass = 'arrow-left';
      tooltipStyle = { top: tt, left: tl };
    } else {
      tooltipStyle = { top: vh / 2 - TOOLTIP_H / 2, left: vw / 2 - TOOLTIP_W / 2 };
    }
  } else {
    tooltipStyle = { top: vh / 2 - TOOLTIP_H / 2, left: vw / 2 - TOOLTIP_W / 2 };
  }

  const ringStyle = targetRect ? {
    top: targetRect.top - 4, left: targetRect.left - 4,
    width: targetRect.width + 8, height: targetRect.height + 8,
  } : null;

  return (
    <>
      {/* Click-through backdrop — clicking it skips the tour */}
      <div
        onClick={dismiss}
        style={{ position: 'fixed', inset: 0, zIndex: 9050, background: 'transparent', cursor: 'default' }}
      />

      {/* Highlight ring */}
      {ringStyle && (
        <div style={{
          position: 'fixed', zIndex: 9100, pointerEvents: 'none',
          borderRadius: '8px',
          boxShadow: '0 0 0 4px rgba(201,168,76,0.85), 0 0 0 9999px rgba(0,0,0,0.52)',
          ...ringStyle,
        }} />
      )}

      {/* Tooltip */}
      <div
        className={`onboarding-tooltip ${arrowClass}`}
        style={{ ...tooltipStyle, width: TOOLTIP_W, position: 'fixed', zIndex: 9200 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="onboarding-tooltip-header">
          <span className="onboarding-tooltip-step">Step {stepIndex + 1} of {STEPS.length}</span>
          <button className="onboarding-tooltip-close" onClick={dismiss} title="Skip tour"><FiX /></button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="onboarding-tooltip-footer">
          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === stepIndex ? 'active' : ''}`} />
            ))}
          </div>
          <div className="onboarding-tooltip-nav">
            {stepIndex > 0 && (
              <button className="onboarding-btn-back" onClick={goBack}>Back</button>
            )}
            <button className="onboarding-btn-next" onClick={goNext}>
              {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
