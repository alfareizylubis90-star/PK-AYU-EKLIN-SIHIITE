import React from 'react';
import { ToastNotification } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border border-[#292929] bg-[#111111] text-white shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#3B82F6] shrink-0" />}
            <span className="text-sm font-medium leading-relaxed">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#A0A0A0] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1f1f1f]"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
