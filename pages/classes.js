import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getSession, saveSession, isTeacher } from "@/lib/session";
import Modal from "../components/Modal";

const DEFAULT_SUBJECTS = ["Math", "Science", "English", "History", "Geography", "Computing", "Art", "Music", "Physical Education"];

const CLASS_COLORS = ["indigo", "purple", "emerald", "amber", "rose", "blue", "green", "orange"];

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ClassesPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    grade: "",
    description: "",
    classCode: ""
  });

  const isEducator = useMemo(() => {
    const s = getSession();
    return s.role === "educator" || isTeacher();
  }, []);

  const classes = useMemo(() => {
    return session?.classroom?.classes || [];
  }, [session?.classroom?.classes]);

  const canCreateClass = isEducator;

  const handleCreateClass = () => {
    const session = getSession();
    if (!session?.classroom) session.classroom = {};
    if (!session?.classroom?.classes) session.classroom.classes = [];

    const newClass = {
      id: `class_${Date.now()}`,
      name: formData.name || "New Class",
      subject: formData.subject || "General",
      grade: formData.grade || "Mixed",
      description: formData.description || "",
      code: formData.classCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      teacher: session.email || "Unknown",
      studentCount: 0,
      assignmentsCount: 0,
      color: CLASS_COLORS[session.classroom.classes.length % CLASS_COLORS.length]
    };

    session.classroom.classes = [...session.classroom.classes, newClass];
    saveSession(session);

    setFormData({ name: "", subject: "", grade: "", description: "", classCode: "" });
    setCreateClassOpen(false);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      subject: classItem.subject,
      grade: classItem.grade,
      description: classItem.description,
      classCode: classItem.code
    });
  };

  const handleUpdateClass = () => {
    if (!editingClass) return;

    const session = getSession();
    const updatedClasses = session?.classroom?.classes?.map(c => 
      c.id === editingClass.id 
        ? { ...c, ...formData }
        : c
    ) || [];

    session.classroom.classes = updatedClasses;
    saveSession(session);

    setEditingClass(null);
    setFormData({ name: "", subject: "", grade: "", description: "", classCode: "" });
  };

  const handleDeleteClass = (classId) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;

    const session = getSession();
    session.classroom.classes = session?.classroom?.classes?.filter(c => c.id !== classId) || [];
    saveSession(session);
  };

  const handleJoinClass = () => {
    const trimmedCode = formData.classCode.trim();
    if (!trimmedCode) {
      alert("Please enter a class code.");
      return;
    }

    // For demo purposes, just show success
    // In real implementation, this would validate against teacher's class list
    alert(`Attempting to join class with code: ${trimmedCode}`);
    
    setFormData({ ...formData, classCode: "" });
  };

  return (
    <>
      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20 overflow-x-hidden">
        <div className="elora-container pt-24 pb-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isEducator ? "My Classes" : "My Classes"}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {isEducator 
                    ? "Manage your classroom and assignments"
                    : "View your enrolled classes and assignments"
                  }
                </p>
              </div>
              
              {isEducator && (
                <button
                  onClick={() => setCreateClassOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <span className="text-lg">+</span>
                  <span className="text-sm font-black uppercase tracking-widest">Create Class</span>
                </button>
              )}
            </div>

            {/* Stats Overview */}
            {classes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{classes.length}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Classes</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {classes.reduce((sum, c) => sum + (c.assignmentsCount || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Assignments</div>
                </div>
              </div>
            )}
          </div>

          {/* Classes Grid */}
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className={cn(
                    "relative group rounded-3xl border p-6 transition-all duration-300 overflow-hidden",
                    "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                    "hover:shadow-xl hover:scale-[1.02] hover:border-indigo-500/30"
                  )}
                >
                  {/* Color accent */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    `bg-${classItem.color || 'indigo'}-500`
                  )} />

                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {classItem.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                          {classItem.subject || "General"}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{classItem.grade || "Mixed"}</span>
                      </div>
                    </div>

                    {isEducator && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClass(classItem)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit class"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete class"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {classItem.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                      {classItem.description}
                    </p>
                  )}

                  {/* Class Code */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                      <span>🔐</span>
                      Class Code
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm text-slate-900 dark:text-white">
                        {classItem.code}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(classItem.code)}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {classItem.studentCount || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Students</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {classItem.assignmentsCount || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Assignments</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-lg font-black text-slate-900 dark:text-white">📊</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Analytics</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex gap-2">
                      <Link
                        href={`/assistant?classCode=${classItem.code}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        <span>💬</span>
                        Open Assistant
                      </Link>
                      <Link
                        href={`/assignments?class=${classItem.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                      >
                        <span>📋</span>
                        Assignments
                      </Link>
                    </div>
                  </div>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 text-indigo-500 text-5xl grid place-items-center mx-auto mb-6 animate-float">
                {isEducator ? "🏫" : "📚"}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isEducator ? "Create your first class" : "No classes yet"}
              </h3>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
                {isEducator 
                  ? "Get started by creating a class and inviting your students to join."
                  : "Join a class using a class code from your teacher."
                }
              </p>

              {isEducator ? (
                <button
                  onClick={() => setCreateClassOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <span className="text-lg">+</span>
                  <span className="font-black uppercase tracking-widest">Create Class</span>
                </button>
              ) : (
                <button
                  onClick={() => setCreateClassOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <span className="text-lg">🔗</span>
                  <span className="font-black uppercase tracking-widest">Join Class</span>
                </button>
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
              href="/assignments"
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg"
            >
              <span>📋</span>
              <span className="font-medium">Assignments</span>
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

      {/* Create/Edit Class Modal */}
      <Modal 
        open={createClassOpen || editingClass !== null} 
        title={editingClass ? "Edit Class" : (isEducator ? "Create New Class" : "Join Class")}
        onClose={() => {
          setCreateClassOpen(false);
          setEditingClass(null);
          setFormData({ name: "", subject: "", grade: "", description: "", classCode: "" });
        }}
      >
        <div className="space-y-4 p-2">
          {isEducator ? (
            <>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  placeholder="e.g., Grade 5 Mathematics"
                  autoFocus={!editingClass}
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                >
                  <option value="">Select a subject</option>
                  {DEFAULT_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                  Grade Level
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  placeholder="e.g., Grade 5, Year 3, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                  placeholder="Brief description of your class..."
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                  Class Code (Auto-generated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.classCode}
                    onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                    className="flex-1 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono"
                    placeholder="AUTO-GENERATED"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, classCode: Math.random().toString(36).substring(2, 8).toUpperCase() })}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-2">
                Class Code
              </label>
              <input
                type="text"
                value={formData.classCode}
                onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono"
                placeholder="Enter class code from your teacher"
                autoFocus
              />
              <button
                onClick={handleJoinClass}
                className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                Join Class
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {isEducator && (
              <button
                onClick={editingClass ? handleUpdateClass : handleCreateClass}
                className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {editingClass ? "Update Class" : "Create Class"}
              </button>
            )}
            <button 
              onClick={() => {
                setCreateClassOpen(false);
                setEditingClass(null);
                setFormData({ name: "", subject: "", grade: "", description: "", classCode: "" });
              }}
              className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}