import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AssignmentCreateWizard, { type AssignmentBasicsState, type AssignmentClassOption } from '../components/assignments/AssignmentCreateWizard';
import { useTeacherClasses } from '../hooks/useTeacherClasses';
import { useAuth } from '../auth/AuthContext';
import { demoClasses } from '../demo/demoTeacherScenarioA';

const initialPreviewBasics: AssignmentBasicsState = {
  classId: null,
  subject: '',
  level: '',
  topic: '',
  dueDate: '',
  estimatedDuration: null,
  sourceMaterial: '',
};

export default function TeacherAssignmentCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useAuth();
  const isDemoRoute = location.pathname.startsWith('/teacher/demo');
  const assignmentsBasePath = isDemoRoute ? '/teacher/demo/assignments' : '/teacher/assignments';
  const [previewBasics, setPreviewBasics] = useState<AssignmentBasicsState>(initialPreviewBasics);

  useEffect(() => {
    if (isDemoRoute && currentUser?.id !== 'teacher_1') {
      login('teacher', undefined, false);
    }
  }, [isDemoRoute, currentUser, login]);

  const { data: teacherClasses, isLoading: isLoadingClasses } = useTeacherClasses();
  const classSource = isDemoRoute && teacherClasses.length === 0 ? demoClasses : teacherClasses;
  const classes: AssignmentClassOption[] = classSource.map((teacherClass) => ({
    id: teacherClass.id,
    name: teacherClass.name,
    subject: teacherClass.subject,
    level: teacherClass.level,
  }));

  const selectedClassName = useMemo(() => {
    if (!previewBasics.classId) return '...';
    const selectedClass = classes.find((classItem) => classItem.id === previewBasics.classId);
    return selectedClass?.name ?? '...';
  }, [classes, previewBasics.classId]);

  const dueLabel = useMemo(() => {
    if (!previewBasics.dueDate) return '...';
    const dueDate = new Date(previewBasics.dueDate);
    if (Number.isNaN(dueDate.getTime())) return previewBasics.dueDate;
    return dueDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }, [previewBasics.dueDate]);

  const handleBack = () => {
    navigate(assignmentsBasePath);
  };

  return (
    <div className="min-h-full bg-[#F9FAFB] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to assignments
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Teacher workflow</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),_0_8px_24px_rgba(149,157,165,0.05)]">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Assignment</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">New assignment</h1>
                <div className="mt-3 space-y-1 border-t border-slate-200/80 pt-3">
                  <p className="[font-family:'Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    CLASS: <span className="text-slate-500">{selectedClassName}</span>
                  </p>
                  <p className="[font-family:'Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    DUE: <span className="text-slate-500">{dueLabel}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                Use the same guided flow, now on a full page so you can focus without a popup.
              </p>

              <div className="rounded-xl border border-teal-600/20 bg-teal-600/[0.04] px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles size={15} className="mt-0.5 text-teal-700" />
                  <p className="text-[11px] font-medium leading-5 text-teal-800">
                    Pro Tip: set class and due date first. Elora can then tailor the next steps to your context.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <AssignmentCreateWizard
              classes={classes}
              isLoadingClasses={isLoadingClasses}
              onBasicsPreviewChange={setPreviewBasics}
              onCancel={handleBack}
              onComplete={handleBack}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
