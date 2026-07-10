import { useState, useEffect, useRef, useCallback } from 'react';
import { FiTrendingUp } from 'react-icons/fi';

// Shared chart components + motion hooks used by both the Analytics overview
// (Analytics.jsx) and its drill-down detail pages (AnalyticsSectionDetail.jsx).
// Split into its own module specifically so those two files can both import
// from here without a circular import between them.

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Reusable motion hooks ----------
//
// These all return CALLBACK refs, not useRef() objects. The Analytics page
// has an early `if (loading) return <simple div>` before its real content
// renders — with a plain useRef()+useEffect(), the effect fires once on
// that first (loading) render, captures ref.current as null, and — since
// its dependency array never changes — never re-runs once the real
// elements mount on a later render. Callback refs sidestep this entirely:
// React invokes them exactly when a node actually attaches, however many
// renders that takes. (Caught by testing this live — every effect was
// silently no-op-ing until this was fixed.)

// One-time perspective/opacity reveal once a section scrolls into view.
// Optionally takes an `onVisible(el)` callback for a chart's own reveal-
// triggered animation (draw-in, fill, etc.) — since this hook returns a
// callback ref (a function), NOT a ref object, there is no `.current` to
// read from a separate effect elsewhere; callers that need to react to
// "this element became visible" must go through `onVisible` here, not by
// trying to read this hook's return value as if it were a ref object.
export function useReveal(onVisible) {
  const cleanupRef = useRef(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;
  return useCallback((el) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add('is-visible');
      onVisibleRef.current?.(el);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          onVisibleRef.current?.(el);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    io.observe(el);
    cleanupRef.current = () => io.disconnect();
  }, []);
}

// Smooth mouse-tilt-follow on hover — direct DOM mutation (not setState) so
// it stays perfectly smooth at mousemove frequency without re-rendering.
export function useTilt(maxTilt = 8) {
  const cleanupRef = useRef(null);
  return useCallback((el) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!el || prefersReducedMotion()) return;
    let raf = null;
    const handleMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - 0.5) * maxTilt;
      const rx = (0.5 - py) * maxTilt;
      el.classList.add('a-tilting');
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
      });
    };
    const handleLeave = () => {
      el.classList.remove('a-tilting');
      el.style.transform = '';
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    cleanupRef.current = () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxTilt]);
}

// Mouse-driven rotation for a real (not flat-skew-only) 3D scene — used by
// Bar3DChart. Rotates the whole bar group in 3D space based on cursor
// position, like turning a physical model in your hands. While the mouse
// isn't over it, a slow CSS keyframe animation (`a3dAmbient` in
// Analytics.css) keeps it gently rotating on its own — the 'is-tilting'
// class (added here) pauses that ambient animation so it doesn't fight the
// mouse-driven transform.
export function use3DSceneTilt(maxTilt = 20) {
  const cleanupRef = useRef(null);
  return useCallback((el) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!el || prefersReducedMotion()) return;
    let raf = null;
    const handleMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - 0.5) * maxTilt * 2;
      const rx = (0.5 - py) * maxTilt;
      el.classList.add('is-tilting');
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    };
    const handleLeave = () => {
      el.classList.remove('is-tilting');
      el.style.transform = '';
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    cleanupRef.current = () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxTilt]);
}

// Animated count-up, restarts only when `to` changes.
export function AnimatedNumber({ to = 0, prefix = '', decimals = 0, duration = 1200 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setValue(to); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          const from = 0;
          const step = (ts) => {
            const p = Math.min(1, (ts - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(from + (to - from) * eased);
            if (p < 1) requestAnimationFrame(step);
            else setValue(to);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return <span ref={ref}>{prefix}{decimals > 0 ? Number(formatted).toLocaleString() : formatted}</span>;
}

// ---------- Chart: animated revenue trend (line + area) ----------
export function TrendChart({ points, title = 'Revenue Trend', headerExtra }) {
  const pathRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const hasRevealedRef = useRef(false);

  const width = 560, height = 200, padX = 24, padY = 24;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = (width - padX * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: height - padY - (p.value / max) * (height - padY * 2),
    ...p
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x.toFixed(1) || padX} ${height - padY} L ${padX} ${height - padY} Z`;

  const playDrawIn = useCallback((duration = 1.1) => {
    const path = pathRef.current;
    if (!path || prefersReducedMotion()) return;
    const len = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    path.getBoundingClientRect(); // force reflow so the transition actually starts from the offset value
    path.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(.22,1,.36,1)`;
    path.style.strokeDashoffset = '0';
  }, []);

  const revealRef = useReveal(() => {
    hasRevealedRef.current = true;
    playDrawIn(1.1);
    setTimeout(() => setDrawn(true), prefersReducedMotion() ? 0 : 400);
  });

  // Re-plays the draw-in whenever the underlying data actually changes (e.g.
  // a time-range dropdown swapping 3/6/12 months) — the chart "reforms"
  // instead of silently snapping to the new shape.
  const pointsKey = points.map((p) => `${p.label}:${p.value}`).join('|');
  const prevKeyRef = useRef(pointsKey);
  useEffect(() => {
    if (!hasRevealedRef.current || prevKeyRef.current === pointsKey) {
      prevKeyRef.current = pointsKey;
      return;
    }
    prevKeyRef.current = pointsKey;
    playDrawIn(0.8);
  }, [pointsKey, playDrawIn]);

  return (
    <div className="a-chart-card a-reveal" ref={revealRef} style={{ position: 'relative' }}>
      <div className="a-chart-head">
        <h3><FiTrendingUp style={{ verticalAlign: '-2px', marginRight: 6, color: '#d4af37' }} />{title}</h3>
        {headerExtra || <span>Last {points.length} months</span>}
      </div>
      <svg className="a-trend-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="aTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={padX} x2={width - padX} y1={height - padY - f * (height - padY * 2)} y2={height - padY - f * (height - padY * 2)} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        <path className={`a-trend-area ${drawn ? 'is-drawn' : ''}`} d={areaPath} fill="url(#aTrendGradient)" />
        <path ref={pathRef} className="a-trend-path" d={linePath} />
        {coords.map((c, i) => (
          <circle
            key={i}
            className={`a-trend-dot ${tooltip?.i === i ? 'is-active' : ''}`}
            cx={c.x} cy={c.y} r={tooltip?.i === i ? 6 : 4}
            onMouseEnter={() => setTooltip({ i, x: c.x, y: c.y, label: c.label, value: c.value })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {coords.map((c, i) => (
          <text key={`lbl-${i}`} className="a-trend-axis-label" x={c.x} y={height - 4} textAnchor="middle">{c.label}</text>
        ))}
      </svg>
      {tooltip && (
        <div
          className="a-chart-tooltip is-visible"
          style={{ left: `${(tooltip.x / width) * 100}%`, top: `${(tooltip.y / height) * 100}%` }}
        >
          {tooltip.label}: ${Math.round(tooltip.value).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ---------- Chart: animated donut ----------
export function DonutChart({ title, segments, size = 168 }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = size / 2 - 14;
  const circumference = 2 * Math.PI * r;

  const revealRef = useReveal(() => {
    if (prefersReducedMotion()) { setProgress(1); return; }
    const start = performance.now();
    const step = (ts) => {
      const p = Math.min(1, (ts - start) / 900);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const arcLen = (seg.value / total) * circumference;
    const dashoffset = -cumulative;
    cumulative += arcLen;
    return { ...seg, arcLen, dashoffset };
  });

  return (
    <div className="a-chart-card a-reveal" ref={revealRef}>
      <div className="a-chart-head">
        <h3>{title}</h3>
        <span>{total} total</span>
      </div>
      <div className="a-donut-wrap">
        <div className="a-donut-figure">
          <svg className="a-donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {arcs.map((a, i) => (
              <circle
                key={i}
                className={`a-donut-arc ${active === i ? 'is-active' : ''}`}
                cx={size / 2} cy={size / 2} r={r}
                stroke={a.color}
                strokeWidth={active === i ? 17 : 14}
                strokeDasharray={`${a.arcLen * progress} ${circumference - a.arcLen * progress}`}
                strokeDashoffset={a.dashoffset}
                style={{ color: a.color }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </svg>
          <div className="a-donut-center">
            <div className="a-donut-total">{active !== null ? arcs[active].value : total}</div>
            <div className="a-donut-caption">{active !== null ? arcs[active].label : 'Total'}</div>
          </div>
        </div>
        <div className="a-legend">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={`a-legend-item ${active === i ? 'is-active' : ''} ${active !== null && active !== i ? 'is-dimmed' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="a-legend-swatch" style={{ background: seg.color }} />
              {seg.label}
              <span className="a-legend-count">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Chart: animated horizontal bars ----------
export function BarChart({ title, rows }) {
  const [drawn, setDrawn] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.value));

  const revealRef = useReveal(() => {
    requestAnimationFrame(() => setDrawn(true));
  });

  return (
    <div className="a-chart-card a-reveal" ref={revealRef}>
      <div className="a-chart-head">
        <h3>{title}</h3>
      </div>
      {rows.map((row, i) => (
        <div className="a-bar-row" key={i}>
          <div className="a-bar-label">{row.label}</div>
          <div className="a-bar-track">
            <div className="a-bar-fill" style={{ width: drawn ? `${(row.value / max) * 100}%` : '0%', transitionDelay: `${i * 80}ms` }} />
          </div>
          <div className="a-bar-value">{row.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- Chart: pseudo-3D extruded bar chart ----------
// Each bar is three flat faces (front/top/side) arranged with CSS skews to
// read as an isometric block — no WebGL, no new dependency. Heights are set
// directly from `rows` on every render; the "reform" behavior (bars visibly
// growing/shrinking to new values, not snapping) comes entirely from the
// `height`/`bottom` CSS transitions on those faces in Analytics.css — any
// time this component re-renders with different `rows`, the browser
// animates the change automatically, whether that's the first reveal (0 →
// value) or new data replacing old (value → new value).
export function Bar3DChart({ title, rows, maxBars = 8, chartHeight = 140 }) {
  const [drawn, setDrawn] = useState(false);
  const displayRows = rows.slice(0, maxBars);
  const max = Math.max(1, ...displayRows.map((r) => r.value));
  const sceneTiltRef = use3DSceneTilt();

  const revealRef = useReveal(() => {
    requestAnimationFrame(() => setDrawn(true));
  });

  return (
    <div className="a-chart-card a-reveal" ref={revealRef}>
      <div className="a-chart-head"><h3>{title}</h3></div>
      <div className="a-bar3d-scene">
        <div className="a-bar3d-group" ref={sceneTiltRef} style={{ height: chartHeight + 40 }}>
          {displayRows.map((row, i) => {
            const h = drawn ? Math.max(4, (row.value / max) * chartHeight) : 0;
            // Small alternating Z-depth stagger so the group rotation reads
            // as real parallax between bars, not just a flat rotating card.
            const depth = (i % 3) * 14;
            return (
              <div className="a-bar3d-col" key={row.label} style={{ transform: `translateZ(${depth}px)` }}>
                <div className="a-bar3d" style={{ height: chartHeight, transitionDelay: `${i * 60}ms` }}>
                  <div className="a-bar3d-top" style={{ bottom: `${h}px`, transitionDelay: `${i * 60}ms` }} />
                  <div className="a-bar3d-side" style={{ height: `${h}px`, transitionDelay: `${i * 60}ms` }} />
                  <div className="a-bar3d-front" style={{ height: `${h}px`, transitionDelay: `${i * 60}ms` }} />
                </div>
                <div className="a-bar3d-value">{row.display ?? row.value}</div>
                <div className="a-bar3d-label">{row.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
