import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import { motion } from "framer-motion";

const ASSIGNMENT_TYPES = [
  { id: "quiz", label: "Quiz", icon: "🎯", description: "Auto-graded questions" },
  { id: "worksheet", label: "Worksheet", icon: "📝", description: "Practice problems" },
  { id: "essay", label: "Essay", icon: "📄", description: "Written response" },
  { id: "project", label: "Project", icon: "🚀", description: "Creative work" }
];

const DIFFICULTY_LEVELS = [
  { id: "beginner", label: "Beginner", color: "emerald" },
  { id: "intermediate", label: "Intermediate", color: "amber" },
  { id: "advanced", label: "Advanced", color: "rose" }
];

function AssignmentCard({ assignment, onView, onEdit, onDelete, userRole }) {
  const difficulty = DIFFICULTY_LEVELS.find(d => d.id === assignment.difficulty) || DIFFICULTY_LEVELS[1];
  const type = ASSIGNMENT_TYPES.find(t => t.id === assignment.type) || ASSIGNMENT_TYPES[0];
  
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl hover:shadow-2xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{type.icon}</span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{assignment.title}</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 bg-${difficulty.color}-100 dark:bg-${difficulty.color}-500/20 text-${difficulty.color}-700 dark:text-${difficulty.color}-300 rounded-lg font-black`}>
                  {difficulty.label}
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-black">
                  {type.label}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
            {assignment.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span className={isOverdue ? "text-red-500 font-black" : ""}>
                {isOverdue ? "Overdue" : daysUntil === 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `Due in ${daysUntil} days`}
              </span>
            </div>
            {assignment.submittedCount !== undefined && (
              <div className="flex items-center gap-1">
                <span>📊</span>
                <span>{assignment.submittedCount}/{assignment.totalStudents} submitted</span>
              </div>
            )}
          </div>
        </div>

        {userRole === 'educator' && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(assignment)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-indigo-500 transition-colors"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(assignment.id)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Student-specific actions */}
      {userRole === 'student' && (
        <div className="flex gap-3 mt-4">
          {assignment.completed ? (
            <button
              onClick={() => onView(assignment)}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 transition-colors"
            >
              View Feedback
            </button>
          ) : (
            <button
              onClick={() => onView(assignment)}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-colors"
            >
              Start Assignment
            </button>
          )}
        </div>
      )}

      {/* Educator-specific actions */}
      {userRole === 'educator' && (
        <div className="flex gap-3 mt-4">
          <Link
            href={`/grades?assignmentId=${assignment.id}`}
            className="flex-1 py-2 text-center border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black hover:bg-indigo-50 transition-colors"
          >
            View Submissions
          </Link>
          <button
            onClick={() => onView(assignment)}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-colors"
          >
            Edit Assignment
          </button>
        </div>
      )}
    </motion.div>
  );
}

function CreateAssignmentModal({ open, onClose, onSave, classData }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "quiz",
    difficulty: "intermediate",
    dueDate: "",
    points: 100,
    aiGenerated: true
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) return;
    
    setIsCreating(true);
    
    // Simulate AI generation if requested
    if (formData.aiGenerated) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setTimeout(() => {
      const newAssignment = {
        id: `assignment_${Date.now()}`,
        ...formData,
        classId: classData?.id || null,
        className: classData?.name || "General",
        createdAt: new Date().toISOString(),
        submittedCount: 0,
        totalStudents: classData?.studentCount || 0
      };
      onSave(newAssignment);
      setFormData({
        title: "",
        description: "",
        type: "quiz", 
        difficulty: "intermediate",
        dueDate: "",
        points: 100,
        aiGenerated: true
      });
      setIsCreating(false);
      onClose();
    }, formData.aiGenerated ? 2000 : 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Create New Assignment</h3>
            {classData && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                For: {classData.name} ({classData.studentCount} students)
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-red-500">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Assignment Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="e.g., Chapter 5 Quiz: Fractions"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ASSIGNMENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.type === type.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20"
                        : "border-slate-200 dark:border-white/10 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <div className="text-sm font-black">{type.label}</div>
                        <div className="text-xs text-slate-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
              placeholder="Detailed instructions for students..."
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 100 })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                min="1"
                max="1000"
              />
            </div>
          </div>

          {/* AI Generation Option */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 border-2 border-dashed border-indigo-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">AI-Generated Questions</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Let Elora create quiz questions based on your class topic
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aiGenerated}
                  onChange={(e) => setFormData({ ...formData, aiGenerated: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {formData.aiGenerated && (
              <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  🎯 Elora will generate 5 questions that align with {classData?.subject || "your subject"} curriculum standards
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {formData.aiGenerated ? "Generating..." : "Creating..."}
                </>
              ) : (
                "Create Assignment"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentSession = getSession();
    setSession(currentSession);
    
    // Get class ID from query
    const classId = router.query.classId;
    
    // Load classes and assignments
    if (currentSession?.classroom?.classes) {
      const classes = currentSession.classroom.classes;
      const targetClass = classId ? classes.find(c => c.id === classId) : classes[0];
      setSelectedClass(targetClass);
      
      // Load assignments for this class
      if (currentSession.classroom.assignments) {
        const classAssignments = currentSession.classroom.assignments.filter(
          a => !classId || a.classId === classId
        );
        setAssignments(classAssignments);
      } else {
        // Demo assignments
        const demoAssignments = [
          {
            id: "assignment_1",
            title: "Chapter 5 Quiz: Fractions and Decimals",
            description: "Complete the quiz on converting between fractions and decimals. Show your work for full credit.",
            type: "quiz",
            difficulty: "intermediate",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 days from now
            points: 50,
            classId: classId || "class_1",
            className: targetClass?.name || "Math Class",
            createdAt: new Date().toISOString(),
            submittedCount: 8,
            totalStudents: targetClass?.studentCount || 24,
            completed: false
          },
          {
            id: "assignment_2", 
            title: "Lab Report: Chemical Reactions",
            description: "Write a detailed lab report on the chemical reactions experiment we conducted in class.",
            type: "essay",
            difficulty: "advanced",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 week from now
            points: 100,
            classId: classId || "class_1",
            className: targetClass?.name || "Science Class",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            submittedCount: 5,
            totalStudents: targetClass?.studentCount || 24,
            completed: false
          }
        ];
        setAssignments(demoAssignments);
      }
    }
  }, [router.query.classId]);

  const handleCreateAssignment = (newAssignment) => {
    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    
    // Save to session
    const currentSession = getSession();
    if (!currentSession.classroom) currentSession.classroom = {};
    if (!currentSession.classroom.assignments) currentSession.classroom.assignments = [];
    currentSession.classroom.assignments = updatedAssignments;
    saveSession(currentSession);
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) return;
    
    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
    setAssignments(updatedAssignments);
    
    // Update session
    const currentSession = getSession();
    if (currentSession?.classroom?.assignments) {
      currentSession.classroom.assignments = updatedAssignments;
      saveSession(currentSession);
    }
  };

  const userRole = session?.role || 'student';

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Assignments - Elora</title>
        <meta name="theme-color" content="#070b16" />
      </Head>

      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="elora-container pt-8 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                {selectedClass ? `${selectedClass.name} - Assignments` : "All Assignments"}
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} • {selectedClass?.studentCount || 0} students
              </p>
            </div>
            
            {userRole === 'educator' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <span className="text-xl">+</span>
                Create Assignment
              </button>
            )}
          </div>

          {/* Class Filter for Educators */}
          {userRole === 'educator' && (
            <div className="mb-8 flex gap-4">
              <Link
                href="/classes"
                className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-black"
              >
                ← Back to Classes
              </Link>
            </div>
          )}

          {/* Assignments Grid */}
          {assignments.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  userRole={userRole}
                  onView={(assignment) => {
                    if (userRole === 'student') {
                      router.push(`/assignments/${assignment.id}/complete`);
                    } else {
                      router.push(`/assignments/${assignment.id}/edit`);
                    }
                  }}
                  onEdit={(assignment) => {
                    router.push(`/assignments/${assignment.id}/edit`);
                  }}
                  onDelete={handleDeleteAssignment}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-3xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                {userRole === 'educator' ? 'No Assignments Created' : 'No Assignments Assigned'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                {userRole === 'educator' 
                  ? 'Create your first assignment to start engaging your students with AI-powered learning activities.'
                  : 'Your teacher hasn\'t assigned any work yet. Check back soon for new assignments.'
                }
              </p>
              {userRole === 'educator' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
                >
                  Create First Assignment
                </button>
              )}
            </div>
          )}

          {/* AI Helper Section */}
          {userRole === 'educator' && (
            <div className="mt-16 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-3xl p-8 text-white text-center">
              <h3 className="text-2xl font-black mb-4">AI Assignment Generator</h3>
              <p className="mb-6 opacity-90 max-w-2xl mx-auto">
                Save hours of preparation time. Elora can generate differentiated questions, 
                create rubrics, and adapt content to your students' learning levels automatically.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/assistant"
                  className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-colors"
                >
                  Try AI Assistant
                </Link>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-700 text-white rounded-2xl font-black hover:bg-indigo-800 transition-colors"
                >
                  Generate with AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateAssignmentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateAssignment}
        classData={selectedClass}
      />
    </>
  );
}