import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, MapPin, Activity, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import BorderBeam from '../../components/common/BorderBeam';

export default function SubmissionConfirmation() {
  const location = useLocation();
  const { user, isGuestMode } = useAuth();
  const [hasCopied, setHasCopied] = useState(false);

  const trackingRef = location.state?.trackingRef || 'ER-2026-SUBMIT';
  const isGuest = isGuestMode || !user;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingRef);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="relative bg-surface/90 backdrop-blur-xl border border-border-subtle text-text-primary p-6 sm:p-8 rounded-sm shadow-2xl w-full max-w-md text-center overflow-hidden">
        <BorderBeam delay={0} color="#60A5FA" />
        <div className="w-14 h-14 bg-green-500/15 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-heading font-black mb-1.5 uppercase tracking-tight text-text-primary">
          Report Submitted!
        </h2>
        <p className="text-text-muted mb-5 text-xs sm:text-sm leading-relaxed">
          {isGuest
            ? 'Thank you for keeping our community safe. Please save your tracking reference to check its status later.'
            : 'Thank you for keeping our community safe! Your report has been linked to your account and can be tracked in your Citizen Dashboard.'}
        </p>

        {/* Tracking Card */}
        <div className="bg-app-bg border border-border-subtle p-3 rounded-sm mb-6 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
              Tracking Reference
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-brand-primary tracking-wider select-all">
              {trackingRef}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xs border border-border-subtle bg-surface hover:bg-brand-primary hover:text-white transition-colors cursor-pointer text-text-secondary"
            title="Copy reference number"
          >
            {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {!isGuest && (
            <Link
              to="/citizen/dashboard"
              className="w-full bg-brand-primary hover:bg-brand-secondary hover:text-black text-white py-3 px-4 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-primary/20"
            >
              <Activity className="w-4 h-4" />
              <span>Track in My Reports</span>
            </Link>
          )}

          <Link
            to="/citizen/public-map"
            className="w-full bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-brand-primary/40 text-text-primary py-3 px-4 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
          >
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>View on Public Map</span>
          </Link>

          <Link
            to="/citizen"
            className="w-full text-text-muted hover:text-text-primary py-2 px-4 rounded-sm font-bold uppercase tracking-wider text-[11px] block transition-colors"
          >
            Submit Another Report
          </Link>
        </div>
      </div>
    </div>
  );
}
