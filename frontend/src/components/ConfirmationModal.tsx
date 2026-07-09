import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmationModalProps) {
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
      id="confirmation-modal"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {isDestructive && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600" id="modal-warning-icon">
                <AlertTriangle className="h-6 w-6" />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                {title}
              </h3>
              <p className="text-base text-slate-600 leading-relaxed" id="modal-message">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            id="modal-cancel-btn"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex min-h-[44px] items-center justify-center rounded-lg px-5 text-base font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500'
                : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 focus:ring-teal-500'
            }`}
            id="modal-confirm-btn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
