import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import AssignmentCreateWizard, { type AssignmentClassOption } from './AssignmentCreateWizard';
import * as dataService from '../../services/dataService';

interface AssignmentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentSidePanel({ isOpen, onClose }: AssignmentSidePanelProps) {
  const [classes, setClasses] = useState<AssignmentClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const teacherClasses = await dataService.getMyClasses();
        if (!cancelled) {
          setClasses(
            teacherClasses.map((teacherClass) => ({
              id: teacherClass.id,
              name: teacherClass.name,
              subject: teacherClass.subject,
              level: teacherClass.level,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setClasses([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingClasses(false);
        }
      }
    };

    void loadClasses();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close assignment panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[90] bg-slate-900/20"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 z-[100] h-full w-[560px] max-w-[calc(100vw-1rem)] border-l border-slate-200 bg-[#F8FAFC] shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Assignment</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">New assignment</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <AssignmentCreateWizard
                  classes={classes}
                  isLoadingClasses={isLoadingClasses}
                  onCancel={onClose}
                  onComplete={onClose}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
