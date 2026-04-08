'use client';

import { X, Zap, Lock } from 'lucide-react';

interface UpgradeNudgeModalProps {
  open: boolean;
  onClose: () => void;
  /** 'church-leader' = can upgrade directly. 'dna-leader' = must ask admin. */
  variant: 'church-leader' | 'dna-leader';
  /** Short description of what they hit the limit on, e.g. "church leaders" */
  limitLabel: string;
  /** Max allowed on free plan */
  limit: number;
}

export default function UpgradeNudgeModal({
  open,
  onClose,
  variant,
  limitLabel,
  limit,
}: UpgradeNudgeModalProps) {
  if (!open) return null;

  const handleUpgrade = () => {
    window.location.href = '/dashboard?tab=billing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-muted hover:text-navy"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-gold" />
        </div>

        {/* Copy */}
        <h2 className="text-lg font-semibold text-navy mb-2">
          Free plan limit reached
        </h2>
        <p className="text-sm text-foreground-muted mb-4">
          Your free plan supports up to {limit} {limitLabel}. Upgrade to unlock the full
          DNA system — unlimited {limitLabel}, groups, cohort, pathway customization, and Live
          Service Mode.
        </p>

        {variant === 'church-leader' ? (
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Upgrade your plan
            </button>
            <button onClick={onClose} className="btn-secondary w-full">
              Not right now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-navy/5 rounded-lg p-3 text-sm text-navy">
              Ask your church admin to upgrade the DNA plan to add more {limitLabel}.
            </div>
            <button onClick={onClose} className="btn-secondary w-full">
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
