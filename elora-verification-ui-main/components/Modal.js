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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {title}
              </h3>
              <button
                className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                onClick={onClose}
                aria-label="Close"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
