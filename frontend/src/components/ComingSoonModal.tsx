import React, { useEffect } from 'react';
import { Sparkles, Calendar, X } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
}: ComingSoonModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      id="coming-soon-modal"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-250 animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="relative bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-8 text-white text-center flex flex-col items-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white mb-3 backdrop-blur-md border border-white/20 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <span className="inline-block bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 mb-2">
            Roadmap Feature
          </span>
          <h3 className="text-xl font-bold tracking-tight">{featureName}</h3>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-base text-slate-600 leading-relaxed text-center">
            {featureDescription}
          </p>
          
          <div className="rounded-xl bg-teal-50/50 border border-teal-100 p-4 flex gap-3.5 items-start">
            <Calendar className="h-5.5 w-5.5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-teal-950">Integration Status</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                This capability requires deep medical API synchronization and a secure schema upgrade. Our engineering team is currently laying the groundwork for this feature in the next system release!
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center bg-slate-50 px-6 py-4 border-t border-slate-150">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] flex items-center justify-center rounded-lg bg-teal-700 px-5 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
            id="coming-soon-close-btn"
          >
            Acknowledge & Notify Me
          </button>
        </div>
      </div>
    </div>
  );
}
