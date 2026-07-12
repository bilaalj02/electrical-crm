import { useState, useEffect, useCallback, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import mesLogo from '../assets/mes-logo.png';
import './Onboarding.css';

const STEPS_ADMIN = [
  {
    target: 'nav-home',
    page: 'home',
    title: 'Dashboard',
    body: 'Your home base. See active jobs, today\'s schedule, recent clients, and quick stats at a glance.',
    placement: 'right',
  },
  {
    target: 'nav-emails',
    page: 'emails',
    title: 'Emails',
    body: 'All incoming emails in one place. The CRM auto-detects work-related messages and lets you create jobs directly from them.',
    placement: 'right',
  },
  {
    target: 'nav-jobs',
    page: 'jobs',
    title: 'Jobs',
    body: 'Create and manage every electrical job. Set status, assign technicians, track quoted costs vs actual expenses, and sync to the calendar.',
    placement: 'right',
  },
  {
    target: 'nav-clients',
    page: 'clients',
    title: 'Clients',
    body: 'Your full client list. View contact details, job history, and communication records for every client.',
    placement: 'right',
  },
  {
    target: 'nav-calendar',
    page: 'calendar',
    title: 'Calendar',
    body: 'See all scheduled jobs in a monthly view. Jobs sync here automatically when you set a date — and optionally to Google Calendar too.',
    placement: 'right',
  },
  {
    target: 'nav-projects',
    page: 'projects',
    title: 'Projects',
    body: 'Photo documentation for each job site. Upload before/after photos, organize by category, and keep a visual record for every project.',
    placement: 'right',
  },
  {
    target: 'nav-diagrams',
    page: 'diagrams',
    title: 'Diagrams',
    body: 'Built-in electrical diagram editor. Create professional wiring diagrams and panel schedules without leaving the CRM.',
    placement: 'right',
  },
  {
    target: 'nav-analytics',
    page: 'analytics',
    title: 'Analytics',
    body: 'Revenue trends, job completion rates, and business performance — all in one dashboard.',
    placement: 'right',
  },
  {
    target: 'nav-marketing',
    page: 'marketing',
    title: 'Marketing',
    body: 'Send outreach campaigns to clients. Use templates for follow-ups, seasonal promotions, and referral requests.',
    placement: 'right',
  },
  {
    target: 'nav-integrations',
    page: 'integrations',
    title: 'Connect Your Email',
    body: 'Head to Integrations to connect Gmail or Outlook. Once connected, emails sync automatically and you can reply directly from the CRM.',
    placement: 'right',
  },
  {
    target: 'nav-user-avatar',
    page: 'settings',
    title: 'Settings & Team',
    body: 'Click your avatar here at the bottom of the sidebar. From there go to Settings to edit your profile, invite employees, and manage your team.',
    placement: 'right',
  },
];

const STEPS_MANAGER = [
  {
    target: 'nav-home',
    page: 'home',
    title: 'Dashboard',
    body: 'Your home base. See active jobs, today\'s schedule, recent clients, and quick stats at a glance.',
    placement: 'right',
  },
  {
    target: 'nav-jobs',
    page: 'jobs',
    title: 'Jobs',
    body: 'Create and manage every electrical job. Set status, assign technicians, track costs, and sync to calendar.',
    placement: 'right',
  },
  {
    target: 'nav-clients',
    page: 'clients',
    title: 'Clients',
    body: 'Your full client list. View contact details, job history, and communication records for every client.',
    placement: 'right',
  },
  {
    target: 'nav-calendar',
    page: 'calendar',
    title: 'Calendar',
    body: 'See all scheduled jobs in a monthly view. Jobs sync here automatically when you set a date.',
    placement: 'right',
  },
  {
    target: 'nav-projects',
    page: 'projects',
    title: 'Projects',
    body: 'Photo documentation for each job site. Upload before/after photos organized by category.',
    placement: 'right',
  },
  {
    target: 'nav-diagrams',
    page: 'diagrams',
    title: 'Diagrams',
    body: 'Built-in electrical diagram editor. Create professional wiring diagrams and panel schedules.',
    placement: 'right',
  },
  {
    target: 'nav-user-avatar',
    page: 'settings',
    title: 'Settings',
    body: 'Click your avatar here to access Settings — update your profile and manage team members.',
    placement: 'right',
  },
];

const STEPS_EMPLOYEE = [
  {
    target: 'nav-home',
    page: 'home',
    title: 'Dashboard',
    body: 'Your personal dashboard. See today\'s scheduled jobs, recent activity, and quick links to your work.',
    placement: 'right',
  },
  {
    target: 'nav-jobs',
    page: 'jobs',
    title: 'Jobs',
    body: 'View jobs assigned to you. Check the address, description, materials needed, and update the status as you progress.',
    placement: 'right',
  },
  {
    target: 'nav-calendar',
    page: 'calendar',
    title: 'Calendar',
    body: 'See your scheduled jobs laid out by date. A quick way to plan your week.',
    placement: 'right',
  },
  {
    target: 'nav-projects',
    page: 'projects',
    title: 'Projects',
    body: 'Upload site photos here. Document before/after shots and any on-site work for the record.',
    placement: 'right',
  },
  {
    target: 'nav-diagrams',
    page: 'diagrams',
    title: 'Diagrams',
    body: 'Access electrical diagrams for jobs. You can view and create wiring diagrams right here.',
    placement: 'right',
  },
  {
    target: 'nav-user-avatar',
    page: 'settings',
    title: 'Your Profile',
    body: 'Click your avatar here at the bottom of the sidebar, then tap Settings to update your name, phone number, and preferred contact method.',
    placement: 'right',
  },
];

function getSteps(role) {
  if (role === 'admin') return STEPS_ADMIN;
  if (role === 'manager') return STEPS_MANAGER;
  return STEPS_EMPLOYEE;
}

function getStorageKey(userId) {
  return `onboarding_complete_${userId}`;
}

export default function Onboarding({ onNavigate }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | welcome | tour | done
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const observerRef = useRef(null);

  const steps = user ? getSteps(user.role) : [];

  // Decide whether to show on mount
  useEffect(() => {
    if (!user) return;
    const key = getStorageKey(user._id || user.id);
    if (!localStorage.getItem(key)) {
      setPhase('welcome');
    }
  }, [user]);

  const dismiss = useCallback(() => {
    if (user) {
      localStorage.setItem(getStorageKey(user._id || user.id), '1');
    }
    setPhase('done');
    setTargetRect(null);
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, [user]);

  const measureTarget = useCallback((target) => {
    const el = document.querySelector(`[data-onboarding="${target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  // Re-measure on window resize
  useEffect(() => {
    if (phase !== 'tour') return;
    const step = steps[stepIndex];
    if (!step) return;

    const measure = () => measureTarget(step.target);
    measure();

    // Poll briefly to let the page finish rendering after navigation
    const timers = [
      setTimeout(measure, 100),
      setTimeout(measure, 300),
      setTimeout(measure, 600),
    ];

    window.addEventListener('resize', measure);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', measure);
    };
  }, [phase, stepIndex, steps, measureTarget]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setPhase('tour');
    if (steps[0]) onNavigate(steps[0].page);
  }, [steps, onNavigate]);

  const goNext = useCallback(() => {
    const next = stepIndex + 1;
    if (next >= steps.length) {
      dismiss();
      return;
    }
    setStepIndex(next);
    onNavigate(steps[next].page);
  }, [stepIndex, steps, dismiss, onNavigate]);

  const goBack = useCallback(() => {
    const prev = stepIndex - 1;
    if (prev < 0) return;
    setStepIndex(prev);
    onNavigate(steps[prev].page);
  }, [stepIndex, steps, onNavigate]);

  if (phase === 'idle' || phase === 'done' || !user) return null;

  // === WELCOME MODAL ===
  if (phase === 'welcome') {
    return (
      <div className="onboarding-welcome-backdrop">
        <div className="onboarding-welcome-card">
          <div className="onboarding-welcome-logo">
            <img src={mesLogo} alt="MES Electrical" style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h2>Welcome to MES Electrical CRM</h2>
          <p>
            Everything you need to manage jobs, clients, and communications in one place.
            Want a quick walkthrough of how it all works?
          </p>
          <div className="onboarding-welcome-actions">
            <button className="onboarding-btn-ghost" onClick={dismiss}>Skip for now</button>
            <button className="onboarding-btn-primary" onClick={startTour}>Take the Tour →</button>
          </div>
        </div>
      </div>
    );
  }

  // === TOUR ===
  const step = steps[stepIndex];
  if (!step) return null;

  // Calculate tooltip position based on target element rect
  const TOOLTIP_W = 300;
  const TOOLTIP_H = 200; // approximate
  const PAD = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let tooltipStyle = {};
  let arrowClass = '';

  if (targetRect) {
    const { top, left, width, height } = targetRect;
    const placement = step.placement || 'right';

    if (placement === 'right') {
      let tipLeft = left + width + PAD;
      let tipTop = top + height / 2 - TOOLTIP_H / 2;
      // clamp vertically
      tipTop = Math.max(PAD, Math.min(vh - TOOLTIP_H - PAD, tipTop));
      // if would overflow right, flip left
      if (tipLeft + TOOLTIP_W > vw - PAD) {
        tipLeft = left - TOOLTIP_W - PAD;
        arrowClass = 'arrow-right';
      } else {
        arrowClass = 'arrow-left';
      }
      tooltipStyle = { top: tipTop, left: tipLeft };
    } else if (placement === 'bottom') {
      let tipLeft = left + width / 2 - TOOLTIP_W / 2;
      let tipTop = top + height + PAD;
      tipLeft = Math.max(PAD, Math.min(vw - TOOLTIP_W - PAD, tipLeft));
      arrowClass = 'arrow-top';
      tooltipStyle = { top: tipTop, left: tipLeft };
    } else if (placement === 'top') {
      let tipLeft = left + width / 2 - TOOLTIP_W / 2;
      let tipTop = top - TOOLTIP_H - PAD;
      tipLeft = Math.max(PAD, Math.min(vw - TOOLTIP_W - PAD, tipLeft));
      arrowClass = 'arrow-bottom';
      tooltipStyle = { top: tipTop, left: tipLeft };
    }
  } else {
    // fallback: center of screen
    tooltipStyle = {
      top: vh / 2 - TOOLTIP_H / 2,
      left: vw / 2 - TOOLTIP_W / 2,
    };
  }

  const ringStyle = targetRect
    ? {
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
      }
    : null;

  return (
    <>
      {/* Spotlight — click-through dark overlay with cutout via box-shadow on the ring */}
      <div
        className="onboarding-spotlight-backdrop"
        onClick={dismiss}
        style={{ background: 'transparent' }}
      />

      {/* Highlight ring with box-shadow cutout */}
      {ringStyle && (
        <div className="onboarding-highlight-ring" style={ringStyle} />
      )}

      {/* Tooltip */}
      <div
        className={`onboarding-tooltip ${arrowClass}`}
        style={{ ...tooltipStyle, width: TOOLTIP_W }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-tooltip-header">
          <span className="onboarding-tooltip-step">Step {stepIndex + 1} of {steps.length}</span>
          <button className="onboarding-tooltip-close" onClick={dismiss} title="Skip tour">
            <FiX />
          </button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="onboarding-tooltip-footer">
          <div className="onboarding-dots">
            {steps.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === stepIndex ? 'active' : ''}`} />
            ))}
          </div>
          <div className="onboarding-tooltip-nav">
            {stepIndex > 0 && (
              <button className="onboarding-btn-back" onClick={goBack}>Back</button>
            )}
            <button className="onboarding-btn-next" onClick={goNext}>
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
