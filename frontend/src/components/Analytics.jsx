import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiDownload, FiChevronDown, FiChevronUp, FiBriefcase, FiUsers, FiMail, FiLink, FiRefreshCw } from 'react-icons/fi';
import { showToast } from './Toast';
import NotificationModal from './NotificationModal';
import './Analytics.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  completed: '#10b981',
  paid: '#10b981',
  invoiced: '#3b82f6',
  'in-progress': '#f59e0b',
  active: '#f59e0b',
  scheduled: '#8b5cf6',
  approved: '#14b8a6',
  quote: '#9ca3af',
  cancelled: '#a8483f'
};
const FALLBACK_COLOR = '#d4af37';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Reusable motion hooks ----------
//
// These all return CALLBACK refs, not useRef() objects. This component has
// an early `if (loading) return <simple div>` before its real content
// renders — with a plain useRef()+useEffect(), the effect fires once on
// that first (loading) render, captures ref.current as null, and — since
// its dependency array never changes — never re-runs once the real
// elements mount on a later render. Callback refs sidestep this entirely:
// React invokes them exactly when a node actually attaches, however many
// renders that takes. (Caught by testing this live — every effect was
// silently no-op-ing until this was fixed.)

// One-time perspective/opacity reveal once a section scrolls into view.
function useReveal() {
  const cleanupRef = useRef(null);
  return useCallback((el) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!el) return;
    if (prefersReducedMotion()) { el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
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
function useTilt(maxTilt = 8) {
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

// Hero: continuous mouse-tilt + scroll-linked recede, both via direct DOM
// mutation driven by rAF — never triggers a React re-render, so it stays
// smooth regardless of how often mousemove/scroll fire. Needs both the
// hero and inner nodes before it can attach listeners, so it tracks
// whichever one shows up first and wires up once both are present.
function useHeroMotion() {
  const nodesRef = useRef({ hero: null, inner: null });
  const cleanupRef = useRef(null);

  const setup = useCallback(() => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    const { hero, inner } = nodesRef.current;
    if (!hero || !inner || prefersReducedMotion()) return;

    let ticking = false;
    let mouseX = 0.5;
    let mouseY = 0.5;

    const apply = () => {
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const heroHeight = rect.height || 1;
      const scrolledPast = Math.max(0, Math.min(1, -rect.top / heroHeight));
      const scrollRotate = scrolledPast * 14;
      const scrollScale = 1 - scrolledPast * 0.12;
      const scrollOpacity = 1 - scrolledPast * 0.85;
      const scrollLift = scrolledPast * -40;

      const tiltY = (mouseX - 0.5) * 34;
      const tiltX = (0.5 - mouseY) * 20;

      inner.style.transform =
        `translateY(${scrollLift}px) scale(${Math.max(0.7, scrollScale)}) ` +
        `rotateX(${(scrollRotate + tiltX).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      inner.style.opacity = Math.max(0, scrollOpacity).toFixed(2);

      // Cursor-following metallic shine on the title text (a ::after clipped
      // to the same text, brightened where the mouse is via these vars).
      hero.style.setProperty('--spot-x', `${(mouseX * 100).toFixed(1)}%`);
      hero.style.setProperty('--spot-y', `${(mouseY * 100).toFixed(1)}%`);
    };

    const requestApply = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };

    const handleScroll = () => requestApply();
    const handleMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / (rect.width || 1);
      mouseY = (e.clientY - rect.top) / (rect.height || 1);
      requestApply();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    hero.addEventListener('mousemove', handleMouseMove);
    apply();

    cleanupRef.current = () => {
      window.removeEventListener('scroll', handleScroll);
      hero.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const heroRef = useCallback((el) => { nodesRef.current.hero = el; setup(); }, [setup]);
  const innerRef = useCallback((el) => { nodesRef.current.inner = el; setup(); }, [setup]);

  return { heroRef, innerRef };
}

// Animated count-up, restarts only when `to` changes.
function AnimatedNumber({ to = 0, prefix = '', decimals = 0, duration = 1200 }) {
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
function TrendChart({ points, title = 'Revenue Trend' }) {
  const revealRef = useReveal();
  const pathRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [drawn, setDrawn] = useState(false);

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

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const path = pathRef.current;
          if (path && !prefersReducedMotion()) {
            const len = path.getTotalLength();
            path.style.strokeDasharray = `${len}`;
            path.style.strokeDashoffset = `${len}`;
            path.getBoundingClientRect(); // force reflow so the transition actually starts from the offset value
            path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)';
            path.style.strokeDashoffset = '0';
          }
          setTimeout(() => setDrawn(true), prefersReducedMotion() ? 0 : 400);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="a-chart-card a-reveal" ref={revealRef} style={{ position: 'relative' }}>
      <div className="a-chart-head">
        <h3><FiTrendingUp style={{ verticalAlign: '-2px', marginRight: 6, color: '#d4af37' }} />{title}</h3>
        <span>Last {points.length} months</span>
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
function DonutChart({ title, segments, size = 168 }) {
  const revealRef = useReveal();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = size / 2 - 14;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    if (prefersReducedMotion()) { setProgress(1); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const step = (ts) => {
            const p = Math.min(1, (ts - start) / 900);
            setProgress(1 - Math.pow(1 - p, 3));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
function BarChart({ title, rows }) {
  const revealRef = useReveal();
  const [drawn, setDrawn] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.value));

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setDrawn(true));
          io.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

// Small sparkline used inside KPI card footers — purely decorative motion
// derived from real trend data, not random noise.
function MiniSpark({ values, color }) {
  if (!values.length) return null;
  const w = 120, h = 28;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const stepX = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => ({ x: i * stepX, y: h - ((v - min) / range) * h }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg className="a-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path className="a-spark-fill" d={area} fill={color} />
      <path d={path} stroke={color} />
    </svg>
  );
}

function Analytics({ onNavigate }) {
  const [stats, setStats] = useState({ jobs: null, clients: null, emails: null });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qbData, setQbData] = useState(null);
  const [qbLoading, setQbLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    quickbooks: true,
    jobs: false,
    clients: false,
    emails: false
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const { heroRef, innerRef } = useHeroMotion();
  const revenueCardRef = useTilt();
  const pendingCardRef = useTilt();
  const profitCardRef = useTilt();
  const clientsCardRef = useTilt();
  const clientsActiveCardRef = useTilt();
  const emailsCardRef = useTilt();
  const workRef = useTilt();
  const jobsTotalCardRef = useTilt();
  const jobsCompletedCardRef = useTilt();
  const jobsActiveCardRef = useTilt();
  const jobsHeadRef = useReveal();
  const clientsHeadRef = useReveal();
  const emailsHeadRef = useReveal();
  const qbSectionRef = useReveal();

  useEffect(() => {
    fetchAnalytics();
    fetchQuickBooksAnalytics();
  }, []);

  // Kept separate from fetchAnalytics() — this hits QuickBooks's own API
  // (not our DB), so a slow or unavailable QuickBooks connection shouldn't
  // block the rest of the page behind the "Loading analytics..." screen.
  const fetchQuickBooksAnalytics = async () => {
    setQbLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/integrations/quickbooks/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQbData(res.data);
    } catch (error) {
      setQbData({
        connected: true,
        reconnectRequired: error.response?.data?.reconnectRequired === true
      });
    } finally {
      setQbLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [jobsRes, clientsRes, emailsRes, allJobsRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/stats`, { headers }),
        axios.get(`${API_URL}/clients/stats`, { headers }),
        axios.get(`${API_URL}/emails/stats/summary`, { headers }),
        axios.get(`${API_URL}/jobs?limit=1000`, { headers })
      ]);

      setStats({
        jobs: jobsRes.data,
        clients: clientsRes.data,
        emails: emailsRes.data
      });
      setJobs(allJobsRes.data.jobs || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownloadPDF = () => {
    showToast('PDF download will be available soon. It will generate a detailed analytics report.', 'info', 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const calculateProfitability = () => {
    const jobsWithExpenses = jobs.filter((j) =>
      j.actualExpenses?.finalTotal &&
      j.actualExpenses.finalTotal > 0 &&
      j.costs?.finalTotal &&
      j.costs.finalTotal > 0
    );

    if (jobsWithExpenses.length === 0) {
      return { count: 0, totalProfit: 0, avgProfitMargin: 0, totalRevenue: 0 };
    }

    const totalProfit = jobsWithExpenses.reduce((sum, j) => sum + (j.costs.finalTotal - j.actualExpenses.finalTotal), 0);
    const totalRevenue = jobsWithExpenses.reduce((sum, j) => sum + j.costs.finalTotal, 0);
    const avgProfitMargin = (totalProfit / totalRevenue) * 100;

    return { count: jobsWithExpenses.length, totalProfit, avgProfitMargin, totalRevenue };
  };

  // Real monthly revenue trend, derived from actual job records — not
  // fabricated data. Buckets by completion/scheduled/created date.
  const getMonthlyRevenue = useCallback((monthsBack = 6) => {
    const now = new Date();
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), value: 0 });
    }
    const revenueStatuses = ['completed', 'paid', 'invoiced'];
    jobs.forEach((j) => {
      if (!revenueStatuses.includes(j.status) || !j.costs?.finalTotal) return;
      const dateStr = j.completionDate || j.scheduledDate || j.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.value += j.costs.finalTotal;
    });
    return months;
  }, [jobs]);

  const profitability = calculateProfitability();
  const monthlyRevenue = getMonthlyRevenue(6);
  const revenueSparkValues = monthlyRevenue.map((m) => m.value);

  const statusSegments = (stats.jobs?.byStatus || [])
    .filter((s) => s._id)
    .map((s) => ({ label: s._id.replace(/-/g, ' '), value: s.count, color: STATUS_COLORS[s._id] || FALLBACK_COLOR }));

  // jobs/stats has no completedJobs/activeJobs fields (that was the source of
  // the NaN% bug) — derive real counts from byStatus instead.
  const jobsByStatusMap = Object.fromEntries((stats.jobs?.byStatus || []).map((s) => [s._id, s.count]));
  const completedJobsCount = jobsByStatusMap['completed'] || 0;
  const activeJobsCount = (jobsByStatusMap['in-progress'] || 0) + (jobsByStatusMap['scheduled'] || 0) + (jobsByStatusMap['approved'] || 0);
  const completionPct = getPercentage(completedJobsCount, stats.jobs?.total);

  const clientTypeRows = (stats.clients?.byType || [])
    .filter((t) => t._id)
    .map((t) => ({ label: t._id, value: t.count }));

  const emailSegments = stats.emails
    ? [
        { label: 'work related', value: stats.emails.workRelated || 0, color: '#3b82f6' },
        { label: 'not classified', value: stats.emails.notClassified || 0, color: '#9ca3af' }
      ].filter((s) => s.value > 0)
    : [];

  // QuickBooks's own numbers — pulled live from QBO, not from whatever's
  // already been synced into Client/Job — kept separate from the CRM-derived
  // charts above.
  const qbIncomeTrend = (qbData?.monthlyTrend || []).map((m) => ({ label: m.month, value: m.income }));
  const qbTotalIncome = (qbData?.monthlyTrend || []).reduce((sum, m) => sum + m.income, 0);
  const qbTotalExpenses = (qbData?.monthlyTrend || []).reduce((sum, m) => sum + m.expenses, 0);
  const qbInvoiceSegments = qbData?.invoiceBreakdown
    ? [
        { label: 'paid', value: qbData.invoiceBreakdown.paid, color: STATUS_COLORS.completed || '#10b981' },
        { label: 'open', value: qbData.invoiceBreakdown.open, color: STATUS_COLORS['in-progress'] || '#f59e0b' },
        { label: 'overdue', value: qbData.invoiceBreakdown.overdue, color: '#ef4444' }
      ].filter((s) => s.value > 0)
    : [];
  const qbTopCustomerRows = (qbData?.topCustomers || []).map((c) => ({ label: c.name, value: c.total }));

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* ---------- 3D hero ---------- */}
      <div className="analytics-hero" ref={heroRef}>
        <div className="analytics-hero-glow" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="analytics-hero-inner" ref={innerRef}>
          <p className="analytics-hero-eyebrow"><span className="a-dot" />Live performance overview</p>
          <h1 className="analytics-hero-title">ANALYTICS</h1>
          <p className="analytics-hero-sub">Revenue, jobs, clients, and email activity — updated in real time from your CRM data.</p>
        </div>
      </div>

      <div className="page-header">
        <div />
        <button className="btn-download-pdf" onClick={handleDownloadPDF}>
          <FiDownload /> Download PDF Report
        </button>
      </div>

      {/* Revenue Analytics - Collapsible */}
      <div className="analytics-section-collapsible a-reveal is-visible">
        <div className="section-header" onClick={() => toggleSection('revenue')}>
          <h2><FiDollarSign /> Revenue Analytics</h2>
          {expandedSections.revenue ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.revenue && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card a-tilt" ref={revenueCardRef}>
                <div className="card-header">
                  <div className="card-icon gold"><FiDollarSign /></div>
                  <div className="card-title"><h3>Total Revenue</h3><p>All Time</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.jobs?.totalRevenue || 0} prefix="$" /></div>
                <MiniSpark values={revenueSparkValues} color="#d4af37" />
                <div className="card-footer">
                  <span className="trend positive"><FiTrendingUp /> {stats.jobs?.total || 0} completed jobs</span>
                </div>
              </div>

              <div className="dashboard-card a-tilt" ref={pendingCardRef}>
                <div className="card-header">
                  <div className="card-icon orange"><FiBarChart2 /></div>
                  <div className="card-title"><h3>Pending Revenue</h3><p>In Progress</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.jobs?.pendingRevenue || 0} prefix="$" /></div>
                <div className="card-footer">
                  <span>{stats.jobs?.unpaidInvoices || 0} unpaid invoices</span>
                </div>
              </div>

              <div className={`dashboard-card a-tilt ${profitability.avgProfitMargin >= 0 ? 'profit-positive' : 'profit-negative'}`} ref={profitCardRef}>
                <div className="card-header">
                  <div className={`card-icon ${profitability.avgProfitMargin >= 0 ? 'green' : 'red'}`}><FiTrendingUp /></div>
                  <div className="card-title"><h3>Avg Profit Margin</h3><p>From Completed Jobs</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={profitability.avgProfitMargin} decimals={1} /><span>%</span></div>
                <div className="card-footer">
                  <span className="trend">{formatCurrency(profitability.totalProfit)} profit from {profitability.count} jobs</span>
                </div>
              </div>
            </div>

            <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
              <TrendChart points={monthlyRevenue} />
              <DonutChart title="Jobs by Status" segments={statusSegments.length ? statusSegments : [{ label: 'No data', value: 1, color: '#e5e7eb' }]} />
            </div>
          </div>
        )}
      </div>

      {/* QuickBooks Financials — live data pulled directly from QuickBooks, not from
          whatever's already been synced into Client/Job. Connection management itself
          (connect/sync/disconnect) still lives on the Integrations page. */}
      <div className="analytics-section-collapsible a-reveal" ref={qbSectionRef}>
        <div className="section-header" onClick={() => toggleSection('quickbooks')}>
          <h2><FiLink /> QuickBooks Financials</h2>
          {expandedSections.quickbooks ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.quickbooks && (
          <div className="section-content">
            {qbLoading ? (
              <p className="hint">Loading live QuickBooks data...</p>
            ) : !qbData?.connected ? (
              <>
                <p className="hint">Connect QuickBooks to see live income, invoices, and top customers here.</p>
                <button className="btn-secondary" onClick={() => onNavigate && onNavigate('integrations')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiLink /> Connect QuickBooks
                </button>
              </>
            ) : qbData?.reconnectRequired ? (
              <>
                <p className="hint">Your QuickBooks connection has expired. Reconnect to keep seeing live financial data here.</p>
                <button className="btn-secondary" onClick={() => onNavigate && onNavigate('integrations')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiRefreshCw /> Reconnect QuickBooks
                </button>
              </>
            ) : (
              <>
                <div className="dashboard-grid">
                  <div className="dashboard-card a-tilt">
                    <div className="card-header">
                      <div className="card-icon gold"><FiDollarSign /></div>
                      <div className="card-title"><h3>QB Total Income</h3><p>Last 6 Months</p></div>
                    </div>
                    <div className="card-value"><AnimatedNumber to={qbTotalIncome} prefix="$" /></div>
                  </div>

                  <div className="dashboard-card a-tilt">
                    <div className="card-header">
                      <div className="card-icon orange"><FiBarChart2 /></div>
                      <div className="card-title"><h3>QB Total Expenses</h3><p>Last 6 Months</p></div>
                    </div>
                    <div className="card-value"><AnimatedNumber to={qbTotalExpenses} prefix="$" /></div>
                  </div>

                  <div className="dashboard-card a-tilt">
                    <div className="card-header">
                      <div className="card-icon red"><FiTrendingUp /></div>
                      <div className="card-title"><h3>Outstanding A/R</h3><p>Unpaid Invoices</p></div>
                    </div>
                    <div className="card-value"><AnimatedNumber to={qbData.outstandingTotal || 0} prefix="$" /></div>
                  </div>
                </div>

                <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
                  {qbIncomeTrend.length > 0 && <TrendChart title="QuickBooks Income Trend" points={qbIncomeTrend} />}
                  {qbInvoiceSegments.length > 0 && <DonutChart title="Invoices by Status" segments={qbInvoiceSegments} />}
                </div>

                {qbTopCustomerRows.length > 0 && (
                  <div className="a-charts-grid-secondary" style={{ marginTop: '1.25rem' }}>
                    <BarChart title="Top Customers" rows={qbTopCustomerRows} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Jobs Analytics - Collapsible */}
      <div className="analytics-section-collapsible a-reveal" ref={jobsHeadRef}>
        <div className="section-header" onClick={() => toggleSection('jobs')}>
          <h2><FiBriefcase /> Jobs Overview</h2>
          {expandedSections.jobs ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.jobs && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card a-tilt" ref={jobsTotalCardRef}>
                <div className="card-header">
                  <div className="card-icon gold"><FiBriefcase /></div>
                  <div className="card-title"><h3>Total Jobs</h3><p>All Time</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.jobs?.total || 0} /></div>
              </div>

              <div className="dashboard-card a-tilt" ref={jobsCompletedCardRef}>
                <div className="card-header">
                  <div className="card-icon green"><FiTrendingUp /></div>
                  <div className="card-title"><h3>Completed</h3><p>{completionPct}% completion rate</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={completedJobsCount} /></div>
              </div>

              <div className="dashboard-card a-tilt" ref={jobsActiveCardRef}>
                <div className="card-header">
                  <div className="card-icon orange"><FiBarChart2 /></div>
                  <div className="card-title"><h3>Active</h3><p>Scheduled + In Progress</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={activeJobsCount} /></div>
              </div>
            </div>

            {statusSegments.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <BarChart title="Jobs by Status" rows={statusSegments} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clients Analytics - Collapsible */}
      <div className="analytics-section-collapsible a-reveal" ref={clientsHeadRef}>
        <div className="section-header" onClick={() => toggleSection('clients')}>
          <h2><FiUsers /> Client Metrics</h2>
          {expandedSections.clients ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.clients && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card a-tilt" ref={clientsCardRef}>
                <div className="card-header">
                  <div className="card-icon purple"><FiUsers /></div>
                  <div className="card-title"><h3>Total Clients</h3><p>Database</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.clients?.total || 0} /></div>
              </div>

              <div className="dashboard-card a-tilt" ref={clientsActiveCardRef}>
                <div className="card-header">
                  <div className="card-icon green"><FiTrendingUp /></div>
                  <div className="card-title"><h3>Active vs Prospects</h3><p>Current Pipeline</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.clients?.active || 0} /></div>
                <div className="card-footer">
                  <span>{stats.clients?.prospects || 0} prospects</span>
                </div>
              </div>
            </div>
            {clientTypeRows.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <BarChart title="Clients by Type" rows={clientTypeRows} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Analytics - Collapsible */}
      <div className="analytics-section-collapsible a-reveal" ref={emailsHeadRef}>
        <div className="section-header" onClick={() => toggleSection('emails')}>
          <h2><FiMail /> Email Statistics</h2>
          {expandedSections.emails ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {expandedSections.emails && (
          <div className="section-content">
            <div className="dashboard-grid">
              <div className="dashboard-card a-tilt" ref={emailsCardRef}>
                <div className="card-header">
                  <div className="card-icon teal"><FiMail /></div>
                  <div className="card-title"><h3>Total Emails</h3><p>All Accounts</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.emails?.total || 0} /></div>
                <div className="card-footer">
                  <span>{stats.emails?.unread || 0} unread emails</span>
                </div>
              </div>

              <div className="dashboard-card a-tilt" ref={workRef}>
                <div className="card-header">
                  <div className="card-icon blue"><FiBriefcase /></div>
                  <div className="card-title"><h3>Work Related</h3><p>Business Emails</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={stats.emails?.workRelated || 0} /></div>
                <div className="card-footer">
                  <span>{stats.emails?.notClassified || 0} not classified</span>
                </div>
              </div>
            </div>

            {emailSegments.length > 0 && (
              <div className="a-charts-grid-secondary" style={{ marginTop: '1.25rem' }}>
                <DonutChart title="Email Classification" segments={emailSegments} />
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Disconnect"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Analytics;
