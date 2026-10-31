import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-slate-900 text-white';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-emerald-900 border border-emerald-700 text-white';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-900 border border-rose-700 text-white';
          icon = <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-900 border border-amber-700 text-white';
          icon = <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-lg text-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            {icon}
            <div className="flex-1 font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-300 hover:text-white transition-colors p-0.5 rounded"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
