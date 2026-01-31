import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getSession, isTeacher } from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  
  const isEducator = useMemo(() => {
    const s = getSession();
    return s.role === "educator" || isTeacher();
  }, []);

  const assignments = useMemo(() => {
    return session?.classroom?.assignments || [];
  }, [session?.classroom?.assignments]);

  const canCreateAssignment = isEducator;

  return (
    <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20 overflow-x-hidden">
      <div className="elora-container pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEducator ? "Assignments" : "My Assignments"}
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {isEducator 
                  ? "Create and manage class assignments"
                  : "View and complete your assigned work"
                }
              </p>
            </div>
            
            {isEducator && (
              <Link
                href="/assistant?action=assignment"
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                <span className="text-lg">+</span>
                <span className="text-sm font-black uppercase tracking-widest">Create Assignment</span>
              </Link>
            )}
          </div>

          {/* Stats Overview */}
          {assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{assignments.length}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Assignments</div>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {assignments.filter(a => a.status === "published").length}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Published</div>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {assignments.filter(a => a.status === "draft").length}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Drafts</div>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {assignments.filter(a => a.submissionsCount > 0).length}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">With Submissions</div>
              </div>
            </div>
          )}
        </div>

        {/* Assignments List */}
        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={cn(
                  "group rounded-2xl border p-6 transition-all duration-300",
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                  "hover:shadow-xl hover:scale-[1.01] hover:border-indigo-500/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {assignment.title}
                      </h3>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-medium",
                        assignment.status === "published" 
                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : assignment.status === "draft"
                          ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "bg-slate-100 dark:bg-slate-700/10 text-slate-700 dark:text-slate-300"
                      )}>
                        {assignment.status || "draft"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        📅 {assignment.dueDate || "No due date"}
                      </span>
                      <span className="flex items-center gap-1">
                        👥 {assignment.submissionsCount || 0} submissions
                      </span>
                      <span className="flex items-center gap-1">
                        📊 {assignment.points || 0} points
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {/* Edit functionality */}}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit assignment"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {/* Delete functionality */}}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete assignment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {assignment.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex gap-2">
                    {isEducator ? (
                      <>
                        <Link
                          href={`/assistant?action=assignment&id=${assignment.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          <span>✏️</span>
                          Edit with AI
                        </Link>
                        <button
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                          <span>👥</span>
                          View Submissions
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/assignments/${assignment.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          <span>📝</span>
                          Start Assignment
                        </Link>
                        <button
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                          <span>📊</span>
                          View Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 text-indigo-500 text-5xl grid place-items-center mx-auto mb-6 animate-float">
              {isEducator ? "📋" : "📝"}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isEducator ? "Create your first assignment" : "No assignments yet"}
            </h3>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
              {isEducator 
                ? "Get started by creating your first assignment with AI assistance."
                : "Your assignments will appear here once they're assigned."
                }
            </p>

            {isEducator && (
              <Link
                href="/assistant?action=assignment"
                className="inline-flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                <span className="text-lg">+</span>
                <span className="font-black uppercase tracking-widest">Create Assignment</span>
              </Link>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link
            href="/assistant"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg"
          >
            <span>💬</span>
            <span className="font-medium">Assistant</span>
          </Link>
          <Link
            href="/classes"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg"
          >
            <span>🏫</span>
            <span className="font-medium">Classes</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg"
          >
            <span>📊</span>
            <span className="font-medium">Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}