import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { getSession, saveSession } from "@/lib/session";

const ASSIGNMENT_TYPES = {
  "quiz": { icon: "📝", label: "Quiz", color: "from-blue-500 to-indigo-600" },
  "worksheet": { icon: "📋", label: "Worksheet", color: "from-emerald-500 to-teal-600" },
  "project": { icon: "🎯", label: "Project", color: "from-purple-500 to-pink-600" },
  "reading": { icon: "📚", label: "Reading", color: "from-amber-500 to-orange-600" }
};

const STATUS_COLORS = {
  "draft": { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  "published": { bg: "bg-blue-100", text: "text-blue-600", label: "Published" },
  "closed": { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" }
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [assignments, setAssignments] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    type: "quiz",
    description: "",
    dueDate: "",
    assignedTo: "all"
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load assignments from session storage (from all classes)
    const allAssignments = [];
    if (session?.classes) {
      session.classes.forEach(cls => {
        if (cls.assignments) {
          cls.assignments.forEach(assignment => {
            allAssignments.push({
              ...assignment,
              className: cls.name,
              classId: cls.id
            });
          });
        }
      });
    }
    setAssignments(allAssignments);
  }, [session]);

  async function handleCreateAssignment() {
    if (!newAssignment.title.trim()) return;

    setCreating(true);
    try {
      const assignmentData = {
        id: `assignment_${Date.now()}`,
        title: newAssignment.title.trim(),
        type: newAssignment.type,
        description: newAssignment.description.trim(),
        dueDate: newAssignment.dueDate,
        assignedTo: newAssignment.assignedTo,
        status: "draft",
        createdAt: new Date().toISOString(),
        submissions: [],
        questions: [],
        maxScore: 100
      };

      // Add to first class (for now - in real app, user would select class)
      const updatedSession = { ...session };
      if (!updatedSession.classes || updatedSession.classes.length === 0) {
        // Create a default class if none exists
        updatedSession.classes = [{
          id: `class_${Date.now()}`,
          name: "Default Class",
          subject: "General",
          level: "Primary School",
          code: "DEFAULT",
          assignments: [assignmentData]
        }];
      } else {
        updatedSession.classes[0].assignments = [
          ...(updatedSession.classes[0].assignments || []),
          assignmentData
        ];
      }

      saveSession(updatedSession);
      setSession(updatedSession);

      // Update local state
      const updatedAssignments = [...assignments, { ...assignmentData, className: updatedSession.classes[0].name, classId: updatedSession.classes[0].id }];
      setAssignments(updatedAssignments);

      // Reset form
      setNewAssignment({ title: "", type: "quiz", description: "", dueDate: "", assignedTo: "all" });
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setCreating(false);
    }
  }

  function handleAssignmentClick(assignmentId) {
    router.push(`/assignments/${assignmentId}`);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Assignments
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Create and manage student assignments with AI assistance
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Create Assignment
            </motion.button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6">
            {["All", "Draft", "Published", "Closed"].map(filter => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-white/5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                {filter}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Assignments Grid */}
        {assignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No assignments yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first assignment to start engaging your students
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCreateModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all"
            >
              Create Your First Assignment
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment, index) => {
              const typeConfig = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.quiz;
              const statusConfig = STATUS_COLORS[assignment.status] || STATUS_COLORS.draft;
              
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5 cursor-pointer shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => handleAssignmentClick(assignment.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${typeConfig.color} flex items-center justify-center text-white text-xl`}>
                        {typeConfig.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{typeConfig.label}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-lg`}>
                      <p className="text-xs font-black">{statusConfig.label}</p>
                    </div>
                  </div>

                  {assignment.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{assignment.submissions?.length || 0}</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Submissions</span>
                    </div>
                    {assignment.className && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {assignment.className}
                      </div>
                    )}
                  </div>

                  {assignment.dueDate && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>📅</span>
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Assignment Modal */}
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setCreateModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 dark:border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Assignment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Math Quiz Chapter 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ASSIGNMENT_TYPES).map(([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAssignment({ ...newAssignment, type })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          newAssignment.type === type
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="text-2xl mb-1">{config.icon}</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    placeholder="Instructions for students..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={!newAssignment.title.trim() || creating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                >
                  {creating ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}