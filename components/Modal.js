import { useEffect } from "react";

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onMouseDown={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                {title}
              </h3>
              <button
                className="rounded-lg px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={onClose}
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
