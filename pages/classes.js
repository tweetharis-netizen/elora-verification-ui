import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import Link from "next/link";
import { motion } from "framer-motion";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function ClassesPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joinStatus, setJoinStatus] = useState("");
  
  const isEducator = session?.role === "educator" || session?.teacher;
  const userClasses = session?.classroom?.classes || [];
  const joinedClasses = session?.joinedClasses || [];

  // Form state for creating a class
  const [newClass, setNewClass] = useState({
    name: "",
    subject: "",
    gradeLevel: "",
    description: "",
    code: ""
  });

  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClass = () => {
    if (!newClass.name || !newClass.subject) {
      return;
    }

    const classData = {
      id: `class_${Date.now()}`,
      name: newClass.name,
      subject: newClass.subject,
      gradeLevel: newClass.gradeLevel,
      description: newClass.description,
      code: generateClassCode(),
      teacherEmail: session.email || "teacher@example.com",
      createdAt: new Date().toISOString(),
      studentCount: 0,
      assignmentsCount: 0,
      isActive: true
    };

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      classes: [...userClasses, classData]
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setCreateClassOpen(false);
    setNewClass({
      name: "",
      subject: "",
      gradeLevel: "",
      description: "",
      code: ""
    });
  };

  const handleJoinClass = () => {
    if (!classCode.trim()) {
      setJoinStatus("Please enter a class code");
      return;
    }

    // In a real implementation, this would validate against a database
    // For demo, we'll simulate joining a class
    const mockClassData = {
      id: `joined_${Date.now()}`,
      name: `Class ${classCode}`,
      subject: "Mathematics",
      gradeLevel: "Grade 10",
      teacherName: "Ms. Johnson",
      code: classCode.toUpperCase(),
      joinedAt: new Date().toISOString()
    };

    const updatedSession = { ...session };
    updatedSession.joinedClasses = [...joinedClasses, mockClassData];
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setJoinStatus("Successfully joined class!");
    setClassCode("");
    
    setTimeout(() => setJoinStatus(""), 3000);
  };

  const handleDeleteClass = (classId) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return;
    }

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      classes: userClasses.filter(c => c.id !== classId)
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
  };

  const handleLeaveClass = (classId) => {
    if (!confirm("Are you sure you want to leave this class?")) {
      return;
    }

    const updatedSession = { ...session };
    updatedSession.joinedClasses = joinedClasses.filter(c => c.id !== classId);
    
    saveSession(updatedSession);
    setSession(updatedSession);
  };

  return (
    <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <div className="elora-container pt-24 lg:pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 font-[var(--font-brand)]">
              {isEducator ? "My Classes" : "My Classes"}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
              {isEducator 
                ? "Create and manage your classroom assignments, track student progress, and share resources."
                : "View your enrolled classes, access assignments, and track your learning progress."
              }
            </p>
          </div>

          {isEducator && (
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4">
                <Link
                  href="/assignments"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Manage Assignments →
                </Link>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  {userClasses.length} active {userClasses.length === 1 ? 'class' : 'classes'}
                </div>
              </div>
              <button
                onClick={() => setCreateClassOpen(true)}
                className="px-6 py-3 bg-fuchsia-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-fuchsia-500/20 hover:scale-105 transition-all"
              >
                + Create New Class
              </button>
            </div>
          )}

          {!isEducator && (
            <div className="mb-8 p-6 rounded-3xl bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Join a Class</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Enter class code"
                  className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
                <button
                  onClick={handleJoinClass}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Join Class
                </button>
              </div>
              {joinStatus && (
                <div className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {joinStatus}
                </div>
              )}
            </div>
          )}

          {/* Classes Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isEducator && userClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-indigo-500/30 hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{classItem.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-xs">
                          {classItem.subject}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">
                          {classItem.gradeLevel}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                      <span className="absolute -inset-1 rounded-full bg-emerald-500 animate-ping opacity-20" />
                    </div>
                  </div>
                  
                  {classItem.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">{classItem.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>Code: <span className="font-mono font-bold">{classItem.code}</span></span>
                    <span>{classItem.studentCount || 0} students</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/assignments?class=${classItem.id}`}
                      className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                    >
                      View Assignments
                    </Link>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl font-semibold text-sm hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {!isEducator && joinedClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-indigo-500/30 hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{classItem.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-xs">
                          {classItem.subject}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">
                          {classItem.gradeLevel}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                      <span className="absolute -inset-1 rounded-full bg-emerald-500 animate-ping opacity-20" />
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    <p><strong>Teacher:</strong> {classItem.teacherName}</p>
                    <p><strong>Joined:</strong> {new Date(classItem.joinedAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/assignments?class=${classItem.id}`}
                      className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                    >
                      View Assignments
                    </Link>
                    <button
                      onClick={() => handleLeaveClass(classItem.id)}
                      className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl font-semibold text-sm hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {((isEducator ? userClasses : joinedClasses).length === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-4xl">
                📚
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                {isEducator ? "No classes yet" : "No enrolled classes"}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
                {isEducator 
                  ? "Create your first class to start managing assignments and tracking student progress."
                  : "Join a class using a code from your teacher to access assignments and learning materials."
                }
              </p>
              {isEducator && (
                <button
                  onClick={() => setCreateClassOpen(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Create Your First Class
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Create Class Modal */}
        {createClassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Class</h2>
                <button
                  onClick={() => setCreateClassOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Class Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="e.g., Grade 10 Mathematics"
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                    <select
                      value={newClass.subject}
                      onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    >
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                      <option value="Computing">Computing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Grade Level</label>
                    <select
                      value={newClass.gradeLevel}
                      onChange={(e) => setNewClass({ ...newClass, gradeLevel: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    >
                      <option value="">Select Grade</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    placeholder="Brief description of the class..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCreateClassOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateClass}
                    disabled={!newClass.name || !newClass.subject}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Class
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}