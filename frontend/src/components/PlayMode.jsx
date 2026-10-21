import { useEffect, useState } from 'react';
import { FiPlayCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { useAddons, money } from '../addons';
import { showToast } from './Toast';
import './PlayMode.css';

// Wraps an add-on's page. In Play mode: a one-time-per-visit intro prompt, then a banner with
// the "Switch to Real mode" switch. In Real mode: a small strip showing the monthly price.
export function AddonPage({ page, children }) {
  const addons = useAddons();
  const addon = addons?.addonForPage(page);
  const [intro, setIntro] = useState(false);
  const [terms, setTerms] = useState(false);

  const real = !addon || addons.isReal(addon.key);
  const seenKey = addon ? `mes-addon-intro-${addon.key}` : '';

  useEffect(() => {
    if (!addon || real) return;
    try {
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, '1');
    } catch { /* private mode: just show it */ }
    setIntro(true);
  }, [addon, real, seenKey]);

  if (!addon) return children;
  const canManage = !!addons.plan?.canManage;

  return (
    <>
      {real ? (
        addons.plan?.bypass && !addon.enabled ? (
          <div className="pm-strip pm-strip-dev">Developer view · {addon.name} is in Play mode for Marc</div>
        ) : (
          <div className="pm-strip">
            <FiCheckCircle /> {addon.name} · Real mode · {money(addon.priceCents)}/mo
          </div>
        )
      ) : (
        <div className="pm-banner" role="status">
          <FiPlayCircle className="pm-banner-icon" />
          <div className="pm-banner-text">
            <strong>Play mode</strong> · Try {addon.name} for free. {addon.playLimits}
          </div>
          {canManage && (
            <label className="pm-switch">
              <span>Switch to Real mode</span>
              <input type="checkbox" checked={false} onChange={() => setTerms(true)} aria-label={`Switch ${addon.name} to Real mode`} />
              <span className="pm-switch-track" />
            </label>
          )}
        </div>
      )}

      {children}

      {intro && (
        <IntroPrompt
          addon={addon}
          canManage={canManage}
          onPlay={() => setIntro(false)}
          onTurnOn={() => { setIntro(false); setTerms(true); }}
        />
      )}
      {terms && <TermsModal addon={addon} onClose={() => setTerms(false)} />}
    </>
  );
}

function IntroPrompt({ addon, canManage, onPlay, onTurnOn }) {
  return (
    <div className="pm-overlay" onClick={onPlay}>
      <div className="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-intro-title" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onPlay} aria-label="Close"><FiX /></button>
        <p className="pm-eyebrow">Optional add-on</p>
        <h2 id="pm-intro-title">{addon.name}</h2>
        <p className="pm-lead">{addon.blurb}</p>
        <div className="pm-price">{money(addon.priceCents)}<span>/month + GST, only if you turn it on</span></div>
        <p className="pm-body">
          Turning this on means accepting the future monthly charge for using this app. If you'd just like to play around with it first,
          you can, but usage is very limited: {addon.playLimits.charAt(0).toLowerCase() + addon.playLimits.slice(1)}
        </p>
        <div className="pm-actions">
          <button className="pm-btn" onClick={onPlay}>Just play around</button>
          {canManage && <button className="pm-btn pm-btn-primary" onClick={onTurnOn}>Turn it on…</button>}
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ addon, onClose }) {
  const addons = useAddons();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = addons.plan?.monthlyCents ?? 0;
  const after = Math.min(current + addon.priceCents, addons.plan?.capCents ?? Infinity);

  const accept = async () => {
    setBusy(true);
    try {
      await addons.enable(addon.key);
      showToast(`${addon.name} is on. It's added to your next invoice.`, 'success');
      onClose();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not turn it on. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-terms-title" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} aria-label="Close"><FiX /></button>
        <p className="pm-eyebrow">Switch to Real mode</p>
        <h2 id="pm-terms-title">{addon.name}</h2>
        <ul className="pm-terms">
          {addon.terms.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div className="pm-total">
          <span>Your monthly plan</span>
          <span>{money(current)} → <strong>{money(after)}</strong> + GST</span>
        </div>
        <label className="pm-agree">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I agree to these terms and the monthly charge starting with my next invoice.
        </label>
        <div className="pm-actions">
          <button className="pm-btn" onClick={onClose}>Stay in Play mode</button>
          <button className="pm-btn pm-btn-primary" disabled={!agree || busy} onClick={accept}>
            {busy ? 'Turning on…' : `Turn on · ${money(addon.priceCents)}/mo`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Settings → Plan: Essentials + every add-on with its switch, and the monthly total. */
export function PlanSettings() {
  const addons = useAddons();
  const [terms, setTerms] = useState(null);
  const [confirmOff, setConfirmOff] = useState(null);
  const plan = addons?.plan;
  if (!plan) return <p style={{ color: '#6b7280' }}>Loading your plan…</p>;

  const turnOff = async (a) => {
    try {
      await addons.disable(a.key);
      showToast(`${a.name} is back in Play mode. It comes off your next invoice.`, 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not change it.', 'error');
    }
    setConfirmOff(null);
  };

  return (
    <div className="pm-plan">
      <div className="pm-plan-head">
        <div>
          <h2>Your plan</h2>
          <p>Pay only for what you use. Anything that's off stays free to try in Play mode.</p>
        </div>
        <div className="pm-plan-total">{money(plan.monthlyCents)}<span>/month + GST</span></div>
      </div>

      <div className="pm-plan-row pm-plan-essentials">
        <div>
          <strong>{plan.essentials.name}</strong> <span className="pm-tag pm-tag-on">Always on</span>
          <p>{plan.essentials.includes.join(' · ')}</p>
        </div>
        <span className="pm-plan-price">{money(plan.essentials.priceCents)}</span>
      </div>

      {plan.addons.map((a) => (
        <div key={a.key} className="pm-plan-row">
          <div>
            <strong>{a.name}</strong>{' '}
            <span className={`pm-tag ${a.enabled ? 'pm-tag-on' : ''}`}>{a.enabled ? 'Real mode' : 'Play mode'}</span>
            <p>{a.blurb}</p>
            {a.history.length > 0 && (
              <p className="pm-plan-history">
                Last change: {a.history[a.history.length - 1].action === 'enabled' ? 'turned on' : 'turned off'} by{' '}
                {a.history[a.history.length - 1].by} on {new Date(a.history[a.history.length - 1].at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="pm-plan-side">
            <span className="pm-plan-price">+{money(a.priceCents)}</span>
            {plan.canManage && (
              <label className="pm-switch pm-switch-sm">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={() => (a.enabled ? setConfirmOff(a) : setTerms(a))}
                  aria-label={`${a.name}: ${a.enabled ? 'on' : 'off'}`}
                />
                <span className="pm-switch-track" />
              </label>
            )}
          </div>
        </div>
      ))}
      <p className="pm-plan-foot">Your total is never more than {money(plan.capCents)}/month + GST, even with everything on.</p>

      {terms && <TermsModal addon={terms} onClose={() => setTerms(null)} />}
      {confirmOff && (
        <div className="pm-overlay" onClick={() => setConfirmOff(null)}>
          <div className="pm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Turn off {confirmOff.name}?</h2>
            <p className="pm-body">It goes back to Play mode right away and comes off your next invoice. Everything you already saved stays; you just can't add or change things until you turn it back on.</p>
            <div className="pm-actions">
              <button className="pm-btn" onClick={() => setConfirmOff(null)}>Keep it on</button>
              <button className="pm-btn pm-btn-primary" onClick={() => turnOff(confirmOff)}>Turn off</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
