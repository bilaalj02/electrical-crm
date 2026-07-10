import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiDownload, FiChevronDown, FiChevronUp, FiBriefcase, FiUsers, FiMail, FiLink, FiRefreshCw } from 'react-icons/fi';
import { showToast } from './Toast';
import NotificationModal from './NotificationModal';
import {
  prefersReducedMotion, useReveal, useTilt,
  AnimatedNumber, TrendChart, DonutChart, BarChart, Bar3DChart
} from './AnalyticsCharts';
import AnalyticsSectionDetail from './AnalyticsSectionDetail';
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
  const [clientsList, setClientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qbData, setQbData] = useState(null);
  const [qbLoading, setQbLoading] = useState(true);
  const [revenueRange, setRevenueRange] = useState(6);
  const [selectedSection, setSelectedSection] = useState(null);
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
  const avgJobValueCardRef = useTilt();
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
      const [jobsRes, clientsRes, emailsRes, allJobsRes, allClientsRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/stats`, { headers }),
        axios.get(`${API_URL}/clients/stats`, { headers }),
        axios.get(`${API_URL}/emails/stats/summary`, { headers }),
        axios.get(`${API_URL}/jobs?limit=1000`, { headers }),
        axios.get(`${API_URL}/clients?limit=1000`, { headers })
      ]);

      setStats({
        jobs: jobsRes.data,
        clients: clientsRes.data,
        emails: emailsRes.data
      });
      setJobs(allJobsRes.data.jobs || []);
      setClientsList(allClientsRes.data.clients || []);
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
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentW = pageW - margin * 2;
      const headerH = 26;
      const footerH = 14;
      let y = margin;

      const gold = [212, 175, 55];
      const goldDark = [184, 148, 31];
      const dark = [26, 32, 44];
      const gray = [107, 114, 128];
      const lightGray = [243, 244, 246];
      const white = [255, 255, 255];
      const red = [220, 38, 38];
      const green = [16, 185, 129];

      const money = (n) => `$${Math.round(n || 0).toLocaleString()}`;

      // Reusable page chrome — every page (including the cover) gets the same
      // header band and footer, so ensureSpace() can add a page mid-section
      // without the report losing its branding partway through.
      const drawHeader = (subtitle = 'Detailed Breakdown') => {
        pdf.setFillColor(...dark);
        pdf.rect(0, 0, pageW, headerH, 'F');
        pdf.setFillColor(...gold);
        pdf.rect(0, headerH, pageW, 1, 'F');
        pdf.setFontSize(15);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...gold);
        pdf.text('MES Electrical', margin, 12);
        pdf.setFontSize(9.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...white);
        pdf.text(subtitle, margin, 19);
        pdf.setFontSize(8);
        pdf.setTextColor(210, 210, 210);
        const generatedOn = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });
        pdf.text(`Generated ${generatedOn}`, pageW - margin, 12, { align: 'right' });
      };

      const drawFooter = () => {
        const pageCount = pdf.internal.getNumberOfPages();
        const current = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageH - footerH, pageW - margin, pageH - footerH);
        pdf.setFontSize(7.5);
        pdf.setTextColor(...gray);
        pdf.text('MES Electrical CRM — Confidential', margin, pageH - 7);
        pdf.text(`Page ${current} of ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
      };

      const ensureSpace = (needed, subtitle) => {
        if (y + needed > pageH - footerH) {
          pdf.addPage();
          drawHeader(subtitle);
          y = headerH + 10;
        }
      };

      const addSectionHeader = (title, subtitle) => {
        ensureSpace(16, subtitle);
        y += 3;
        pdf.setFillColor(...gold);
        pdf.rect(margin, y - 4, 3, 6, 'F');
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...dark);
        pdf.text(title, margin + 6, y);
        pdf.setDrawColor(225, 225, 225);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y + 3, pageW - margin, y + 3);
        y += 9;
      };

      const addRow = (label, value, opts = {}) => {
        ensureSpace(7.5, opts.subtitle);
        if (opts.shaded) {
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, y - 4.2, contentW, 6.6, 'F');
        }
        pdf.setFontSize(9.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...gray);
        pdf.text(String(label), margin + 2, y);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...(opts.color || dark));
        pdf.text(String(value), pageW - margin - 2, y, { align: 'right' });
        y += 6.6;
      };

      const addBarRow = (label, value, max, displayValue, color) => {
        ensureSpace(8);
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...dark);
        const labelText = String(label).length > 24 ? String(label).slice(0, 23) + '…' : String(label);
        pdf.text(labelText, margin, y + 3);
        const barX = margin + 44;
        const barW = contentW - 44 - 18;
        pdf.setFillColor(...lightGray);
        pdf.roundedRect(barX, y, barW, 4, 1, 1, 'F');
        const fillW = max > 0 ? Math.max(2, (value / max) * barW) : 0;
        pdf.setFillColor(...(color || gold));
        pdf.roundedRect(barX, y, fillW, 4, 1, 1, 'F');
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...dark);
        pdf.text(String(displayValue ?? value), pageW - margin, y + 3, { align: 'right' });
        y += 7.5;
      };

      // A KPI tile grid for the executive summary — the "most important
      // things first" the user asked for, sized for 3-per-row on Letter.
      const addKPIGrid = (tiles) => {
        const cols = 3;
        const gap = 5;
        const tileW = (contentW - gap * (cols - 1)) / cols;
        const tileH = 26;
        tiles.forEach((tile, i) => {
          const col = i % cols;
          if (col === 0 && i > 0) y += tileH + gap;
          ensureSpace(tileH + gap);
          const x = margin + col * (tileW + gap);
          pdf.setFillColor(...dark);
          pdf.roundedRect(x, y, tileW, tileH, 2, 2, 'F');
          pdf.setFillColor(...(tile.accent || gold));
          pdf.rect(x, y, tileW, 1.4, 'F');
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(200, 200, 200);
          pdf.text(tile.label, x + 4, y + 8);
          pdf.setFontSize(15);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(...(tile.accent || gold));
          pdf.text(tile.value, x + 4, y + 17);
          if (tile.sub) {
            pdf.setFontSize(7.5);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(190, 190, 190);
            pdf.text(tile.sub, x + 4, y + 22.5);
          }
        });
        y += tileH + 10;
      };

      // ================= COVER / EXECUTIVE SUMMARY =================
      drawHeader('Performance Report — Executive Summary');
      y = headerH + 14;

      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...dark);
      pdf.text('Executive Summary', margin, y);
      y += 8;

      const overdueCount = qbData?.connected ? (qbData.invoiceBreakdown?.overdue || 0) : 0;
      const outstanding = qbData?.connected ? (qbData.outstandingTotal || 0) : (stats.jobs?.pendingRevenue || 0);
      const narrative =
        `${stats.jobs?.total || 0} total jobs on record, ${completedJobsCount} completed ` +
        `(${completionPct}% completion rate) for ${money(stats.jobs?.totalRevenue)} in revenue at a ` +
        `${profitability.avgProfitMargin.toFixed(1)}% average profit margin. ` +
        `${money(outstanding)} is currently outstanding` +
        (overdueCount > 0 ? `, including ${overdueCount} overdue invoice${overdueCount === 1 ? '' : 's'} that need follow-up.` : '.');
      pdf.setFontSize(10.5);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(...gray);
      const narrativeLines = pdf.splitTextToSize(narrative, contentW);
      pdf.text(narrativeLines, margin, y);
      y += narrativeLines.length * 5.5 + 6;

      addKPIGrid([
        { label: 'TOTAL REVENUE', value: money(stats.jobs?.totalRevenue), sub: 'All time' },
        { label: 'OUTSTANDING A/R', value: money(outstanding), sub: overdueCount > 0 ? `${overdueCount} overdue` : 'On track', accent: overdueCount > 0 ? red : gold },
        { label: 'AVG PROFIT MARGIN', value: `${profitability.avgProfitMargin.toFixed(1)}%`, sub: `${money(profitability.totalProfit)} profit` },
        { label: 'JOB COMPLETION', value: `${completionPct}%`, sub: `${completedJobsCount} of ${stats.jobs?.total || 0} jobs` },
        { label: 'ACTIVE PIPELINE', value: String(activeJobsCount), sub: 'Scheduled + in progress' },
        { label: 'ACTIVE CLIENTS', value: String(stats.clients?.active || 0), sub: `${stats.clients?.prospects || 0} prospects` }
      ]);

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...dark);
      pdf.text('What this report covers', margin, y);
      y += 6;
      ['Revenue Analytics — monthly trend, margins, and pending revenue',
       'QuickBooks Financials — live income, expenses, and receivables (if connected)',
       'Jobs Overview — full status breakdown and completion metrics',
       'Client Metrics — active pipeline and client mix',
       'Email Statistics — inbound volume and work-related classification'
      ].forEach((line) => {
        ensureSpace(6);
        pdf.setFontSize(9.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...gray);
        pdf.text(`•  ${line}`, margin + 2, y);
        y += 5.5;
      });

      // ================= DETAILED BREAKDOWN =================
      pdf.addPage();
      drawHeader('Detailed Breakdown');
      y = headerH + 12;

      addSectionHeader('Revenue Analytics', 'Detailed Breakdown');
      addRow('Total Revenue (All Time)', money(stats.jobs?.totalRevenue), { shaded: true });
      addRow('Pending Revenue (In Progress)', money(stats.jobs?.pendingRevenue));
      addRow('Unpaid Invoices', stats.jobs?.unpaidInvoices || 0, { shaded: true });
      addRow('Avg Profit Margin', `${profitability.avgProfitMargin.toFixed(1)}%`);
      addRow('Profit (Completed Jobs)', money(profitability.totalProfit), { shaded: true, color: green });
      y += 3;
      if (monthlyRevenue.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...gray);
        pdf.text('MONTHLY TREND', margin, y);
        y += 5;
        const maxRev = Math.max(1, ...monthlyRevenue.map((m) => m.value));
        monthlyRevenue.forEach((m) => addBarRow(m.label, m.value, maxRev, money(m.value)));
      }

      if (qbData?.connected && !qbData?.reconnectRequired) {
        addSectionHeader('QuickBooks Financials (Live)', 'Detailed Breakdown');
        addRow('Total Income (Last 6 Months)', money(qbTotalIncome), { shaded: true, color: green });
        addRow('Total Expenses (Last 6 Months)', money(qbTotalExpenses));
        addRow('Outstanding A/R', money(qbData.outstandingTotal), { shaded: true, color: qbData.outstandingTotal > 0 ? red : dark });
        if (qbData.invoiceBreakdown) {
          addRow('Invoices — Paid', qbData.invoiceBreakdown.paid || 0);
          addRow('Invoices — Open', qbData.invoiceBreakdown.open || 0, { shaded: true });
          addRow('Invoices — Overdue', qbData.invoiceBreakdown.overdue || 0, { color: qbData.invoiceBreakdown.overdue > 0 ? red : dark });
        }
        if (qbTopCustomerRows.length > 0) {
          y += 3;
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(...gray);
          pdf.text('TOP CUSTOMERS', margin, y);
          y += 5;
          const maxCust = Math.max(1, ...qbTopCustomerRows.map((c) => c.value));
          qbTopCustomerRows.forEach((c) => addBarRow(c.label, c.value, maxCust, money(c.value)));
        }
      }

      addSectionHeader('Jobs Overview', 'Detailed Breakdown');
      addRow('Total Jobs', stats.jobs?.total || 0, { shaded: true });
      addRow('Completed', `${completedJobsCount} (${completionPct}%)`, { color: green });
      addRow('Active (Scheduled + In Progress)', activeJobsCount, { shaded: true });
      if (statusSegments.length > 0) {
        y += 3;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...gray);
        pdf.text('BY STATUS', margin, y);
        y += 5;
        const maxStatus = Math.max(1, ...statusSegments.map((s) => s.value));
        statusSegments.forEach((s) => addBarRow(s.label, s.value, maxStatus));
      }

      addSectionHeader('Client Metrics', 'Detailed Breakdown');
      addRow('Total Clients', stats.clients?.total || 0, { shaded: true });
      addRow('Active', stats.clients?.active || 0);
      addRow('Prospects', stats.clients?.prospects || 0, { shaded: true });
      if (clientTypeRows.length > 0) {
        y += 3;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...gray);
        pdf.text('BY TYPE', margin, y);
        y += 5;
        const maxType = Math.max(1, ...clientTypeRows.map((c) => c.value));
        clientTypeRows.forEach((c) => addBarRow(c.label, c.value, maxType));
      }

      addSectionHeader('Email Statistics', 'Detailed Breakdown');
      addRow('Total Emails', stats.emails?.total || 0, { shaded: true });
      addRow('Unread', stats.emails?.unread || 0);
      addRow('Work Related', stats.emails?.workRelated || 0, { shaded: true });
      addRow('Not Classified', stats.emails?.notClassified || 0);

      // Footer on every page, drawn last so it reflects the final page count.
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        drawFooter();
      }

      pdf.save(`MES_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Analytics report downloaded.', 'success');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      showToast('Failed to generate the PDF report. Please try again.', 'error');
    }
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
  const monthlyRevenue = getMonthlyRevenue(revenueRange);
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
  // Real revenue-per-job figure — a core estimating/pricing benchmark for an
  // electrical contractor, not shown anywhere else on this page before.
  const avgJobValue = completedJobsCount > 0 ? (stats.jobs?.totalRevenue || 0) / completedJobsCount : 0;

  const clientTypeRows = (stats.clients?.byType || [])
    .filter((t) => t._id)
    .map((t) => ({ label: t._id, value: t.count }));

  const emailSegments = stats.emails
    ? [
        { label: 'work related', value: stats.emails.workRelated || 0, color: '#3b82f6' },
        { label: 'not classified', value: stats.emails.notClassified || 0, color: '#9ca3af' }
      ].filter((s) => s.value > 0)
    : [];

  // Already returned by /api/emails/stats/summary but unused until now.
  const emailsByAccountRows = (stats.emails?.byAccount || [])
    .filter((a) => a._id)
    .map((a) => ({ label: a._id, value: a.count }));

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
  const qbAgedReceivablesRows = (qbData?.agedReceivables || []).map((b) => ({ label: b.label, value: b.value, display: formatCurrency(b.value) }));

  // ---------- Deeper analytics for the drill-down sub-pages ----------
  const REVENUE_STATUSES = ['completed', 'paid', 'invoiced'];

  // Top clients by revenue — real job-level data; `client` is already
  // populated on each job from GET /api/jobs?limit=1000.
  const topClientsByRevenue = (() => {
    const totals = new Map();
    jobs.forEach((j) => {
      if (!REVENUE_STATUSES.includes(j.status) || !j.costs?.finalTotal) return;
      const name = j.client?.name || j.client?.company || 'Unknown client';
      totals.set(name, (totals.get(name) || 0) + j.costs.finalTotal);
    });
    return Array.from(totals.entries())
      .map(([label, value]) => ({ label, value, display: formatCurrency(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })();

  // Job value distribution — real job sizes, a genuine "job mix" view.
  const jobValueDistribution = (() => {
    const buckets = [
      { label: '<$500', min: 0, max: 500, value: 0 },
      { label: '$500-2k', min: 500, max: 2000, value: 0 },
      { label: '$2k-5k', min: 2000, max: 5000, value: 0 },
      { label: '$5k+', min: 5000, max: Infinity, value: 0 }
    ];
    jobs.forEach((j) => {
      if (!REVENUE_STATUSES.includes(j.status) || !j.costs?.finalTotal) return;
      const v = j.costs.finalTotal;
      const bucket = buckets.find((b) => v >= b.min && v < b.max);
      if (bucket) bucket.value += 1;
    });
    return buckets.map((b) => ({ label: b.label, value: b.value }));
  })();

  // Profit margin by month, same bucketing shape as getMonthlyRevenue but
  // margin instead of raw revenue — uses the same range dropdown.
  const profitMarginTrend = (() => {
    const now = new Date();
    const months = [];
    for (let i = revenueRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), revenue: 0, expenses: 0 });
    }
    jobs.forEach((j) => {
      if (!j.actualExpenses?.finalTotal || !j.costs?.finalTotal) return;
      const dateStr = j.completionDate || j.scheduledDate || j.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) { bucket.revenue += j.costs.finalTotal; bucket.expenses += j.actualExpenses.finalTotal; }
    });
    return months.map((m) => ({
      label: m.label,
      value: m.revenue > 0 ? Math.round(((m.revenue - m.expenses) / m.revenue) * 100) : 0
    }));
  })();

  // Completion velocity — average days scheduled → completed, real jobs only.
  const completionVelocityDays = (() => {
    const durations = jobs
      .filter((j) => j.scheduledDate && j.completionDate)
      .map((j) => (new Date(j.completionDate) - new Date(j.scheduledDate)) / (1000 * 60 * 60 * 24))
      .filter((d) => Number.isFinite(d) && d >= 0);
    if (durations.length === 0) return null;
    return Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10;
  })();

  // Jobs created vs. completed per month.
  const jobsVelocityTrend = (() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), created: 0, completed: 0 });
    }
    jobs.forEach((j) => {
      if (j.createdAt) {
        const d = new Date(j.createdAt);
        const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
        if (bucket) bucket.created += 1;
      }
      if (j.completionDate) {
        const d = new Date(j.completionDate);
        const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
        if (bucket) bucket.completed += 1;
      }
    });
    return months;
  })();

  // New clients per month — real client records, not job-derived.
  const newClientsPerMonth = (() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), value: 0 });
    }
    clientsList.forEach((c) => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.value += 1;
    });
    return months;
  })();

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

      {selectedSection ? (
        <AnalyticsSectionDetail
          section={selectedSection}
          onBack={() => setSelectedSection(null)}
          onNavigate={onNavigate}
          data={{
            stats, profitability, avgJobValue, monthlyRevenue, revenueRange, setRevenueRange,
            profitMarginTrend, topClientsByRevenue, jobValueDistribution, formatCurrency,
            qbData, qbLoading, qbIncomeTrend, qbTotalIncome, qbTotalExpenses,
            qbInvoiceSegments, qbTopCustomerRows, qbAgedReceivablesRows,
            statusSegments, completedJobsCount, activeJobsCount, completionPct,
            completionVelocityDays, jobsVelocityTrend,
            clientTypeRows, newClientsPerMonth,
            emailSegments, emailsByAccountRows
          }}
        />
      ) : (
      <>
      {/* Revenue Analytics - Collapsible */}
      <div className="analytics-section-collapsible a-reveal is-visible">
        <div className="section-header" onClick={() => toggleSection('revenue')}>
          <h2><FiDollarSign /> Revenue Analytics</h2>
          <div className="a-section-header-right">
            <button className="a-view-full-link" onClick={(e) => { e.stopPropagation(); setSelectedSection('revenue'); }}>View Full Report →</button>
            {expandedSections.revenue ? <FiChevronUp /> : <FiChevronDown />}
          </div>
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

              <div className="dashboard-card a-tilt" ref={avgJobValueCardRef}>
                <div className="card-header">
                  <div className="card-icon blue"><FiBriefcase /></div>
                  <div className="card-title"><h3>Avg Job Value</h3><p>Per Completed Job</p></div>
                </div>
                <div className="card-value"><AnimatedNumber to={avgJobValue} prefix="$" /></div>
                <div className="card-footer">
                  <span>Key estimating benchmark</span>
                </div>
              </div>
            </div>

            <div className="a-charts-grid" style={{ marginTop: '1.25rem' }}>
              <TrendChart
                points={monthlyRevenue}
                headerExtra={
                  <select
                    className="a-range-select"
                    value={revenueRange}
                    onChange={(e) => setRevenueRange(Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                  </select>
                }
              />
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
          <div className="a-section-header-right">
            <button className="a-view-full-link" onClick={(e) => { e.stopPropagation(); setSelectedSection('quickbooks'); }}>View Full Report →</button>
            {expandedSections.quickbooks ? <FiChevronUp /> : <FiChevronDown />}
          </div>
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
          <div className="a-section-header-right">
            <button className="a-view-full-link" onClick={(e) => { e.stopPropagation(); setSelectedSection('jobs'); }}>View Full Report →</button>
            {expandedSections.jobs ? <FiChevronUp /> : <FiChevronDown />}
          </div>
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
          <div className="a-section-header-right">
            <button className="a-view-full-link" onClick={(e) => { e.stopPropagation(); setSelectedSection('clients'); }}>View Full Report →</button>
            {expandedSections.clients ? <FiChevronUp /> : <FiChevronDown />}
          </div>
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
          <div className="a-section-header-right">
            <button className="a-view-full-link" onClick={(e) => { e.stopPropagation(); setSelectedSection('emails'); }}>View Full Report →</button>
            {expandedSections.emails ? <FiChevronUp /> : <FiChevronDown />}
          </div>
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
      </>
      )}

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
