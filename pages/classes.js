import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { getSession, saveSession } from "@/lib/session";

const SUBJECT_ICONS = {
  "Math": "🔢",
  "Science": "🔬", 
  "English": "📚",
  "History": "📜",
  "Geography": "🌍",
  "Computing": "💻",
  "General": "📖"
};

const LEVEL_COLORS = {
  "Primary School": "from-emerald-500 to-teal-600",
  "Secondary School": "from-blue-500 to-indigo-600", 
  "Junior College / Pre-U": "from-purple-500 to-pink-600",
  "University": "from-amber-500 to-orange-600"
};

export default function ClassesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [classes, setClasses] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    subject: "General",
    level: "Primary School",
    description: ""
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load classes from session storage
    const storedClasses = session?.classes || [];
    setClasses(storedClasses);
  }, [session]);

  async function handleCreateClass() {
    if (!newClass.name.trim()) return;

    setCreating(true);
    try {
      const classData = {
        id: `class_${Date.now()}`,
        name: newClass.name.trim(),
        subject: newClass.subject,
        level: newClass.level,
        description: newClass.description.trim(),
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        studentCount: 0,
        assignments: [],
        educator: {
          name: session.email?.split('@')[0] || "Teacher",
          email: session.email || ""
        }
      };

      const updatedClasses = [...classes, classData];
      setClasses(updatedClasses);

      // Save to session
      const updatedSession = { ...session, classes: updatedClasses };
      saveSession(updatedSession);
      setSession(updatedSession);

      // Reset form
      setNewClass({ name: "", subject: "General", level: "Primary School", description: "" });
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating class:", error);
    } finally {
      setCreating(false);
    }
  }

  function handleClassClick(classId) {
    router.push(`/classes/${classId}`);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
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
                My Classes
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage your classroom and track student progress
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Create Class
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Classes</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{classes.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  📚
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Students</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  👥
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Assignments</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {classes.reduce((sum, cls) => sum + (cls.assignments?.length || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  📝
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No classes yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first class to start managing your students and assignments
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCreateModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all"
            >
              Create Your First Class
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5 cursor-pointer shadow-xl hover:shadow-2xl transition-all"
                onClick={() => handleClassClick(cls.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${LEVEL_COLORS[cls.level] || LEVEL_COLORS["Primary School"]} flex items-center justify-center text-white text-xl`}>
                      {SUBJECT_ICONS[cls.subject] || SUBJECT_ICONS["General"]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{cls.subject} • {cls.level}</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400">{cls.code}</p>
                  </div>
                </div>

                {cls.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {cls.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{cls.studentCount}</span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{cls.assignments?.length || 0}</span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Assignments</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Class Modal */}
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Class</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Grade 5 Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject
                  </label>
                  <select
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(SUBJECT_ICONS).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Level
                  </label>
                  <select
                    value={newClass.level}
                    onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(LEVEL_COLORS).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="Brief description of the class..."
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
                  onClick={handleCreateClass}
                  disabled={!newClass.name.trim() || creating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}