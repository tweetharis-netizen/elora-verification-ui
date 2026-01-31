import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import Link from "next/link";
import { motion } from "framer-motion";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const isEducator = session?.role === "educator" || session?.teacher;
  const userClasses = session?.classroom?.classes || [];
  const joinedClasses = session?.joinedClasses || [];
  const allAssignments = session?.classroom?.assignments || [];

  // Form state for creating assignment
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subject: "",
    gradeLevel: "",
    dueDate: "",
    assignedClass: "",
    type: "assignment", // assignment, quiz, project
    aiGenerate: false,
    questions: []
  });

  // Filter assignments based on user role and filters
  const filteredAssignments = useMemo(() => {
    let assignments = [];
    
    if (isEducator) {
      // Educators see assignments they created
      assignments = allAssignments.filter(assignment => 
        assignment.teacherEmail === session.email
      );
    } else {
      // Students see assignments from classes they joined
      assignments = allAssignments.filter(assignment => 
        joinedClasses.some(cls => cls.id === assignment.classId)
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      assignments = assignments.filter(assignment => assignment.status === filterStatus);
    }

    // Apply class filter
    if (filterClass !== "all") {
      assignments = assignments.filter(assignment => assignment.classId === filterClass);
    }

    // Apply search filter
    if (searchQuery) {
      assignments = assignments.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allAssignments, isEducator, joinedClasses, filterStatus, filterClass, searchQuery]);

  const assignmentStats = useMemo(() => {
    const total = filteredAssignments.length;
    const draft = filteredAssignments.filter(a => a.status === "draft").length;
    const published = filteredAssignments.filter(a => a.status === "published").length;
    const closed = filteredAssignments.filter(a => a.status === "closed").length;
    const dueSoon = filteredAssignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    return { total, draft, published, closed, dueSoon };
  }, [filteredAssignments]);

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.description) {
      return;
    }

    const assignmentData = {
      id: `assignment_${Date.now()}`,
      title: newAssignment.title,
      description: newAssignment.description,
      subject: newAssignment.subject,
      gradeLevel: newAssignment.gradeLevel,
      dueDate: newAssignment.dueDate,
      classId: newAssignment.assignedClass,
      type: newAssignment.type,
      teacherEmail: session.email || "teacher@example.com",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissions: [],
      questions: newAssignment.questions
    };

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      assignments: [...allAssignments, assignmentData]
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setCreateModalOpen(false);
    setNewAssignment({
      title: "",
      description: "",
      subject: "",
      gradeLevel: "",
      dueDate: "",
      assignedClass: "",
      type: "assignment",
      aiGenerate: false,
      questions: []
    });

    // Navigate to the assignment detail page
    router.push(`/assignments/${assignmentData.id}`);
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      assignments: allAssignments.filter(a => a.id !== assignmentId)
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
  };

  const handlePublishAssignment = (assignmentId) => {
    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      assignments: allAssignments.map(a => 
        a.id === assignmentId ? { ...a, status: "published" } : a
      )
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
  };

  const generateQuestionsWithAI = () => {
    // Simulate AI question generation
    const sampleQuestions = [
      { id: 1, question: "What is the main concept being tested?", type: "text" },
      { id: 2, question: "Provide an example to demonstrate understanding", type: "text" },
      { id: 3, question: "Solve this problem: 2x + 5 = 15, find x", type: "text" },
      { id: 4, question: "Explain the steps in your own words", type: "text" },
      { id: 5, question: "Rate your confidence level (1-5)", type: "rating" }
    ];

    setNewAssignment({
      ...newAssignment,
      questions: sampleQuestions
    });
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-[var(--font-brand)]">
                Assignments
              </h1>
              {isEducator && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  + Create Assignment
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                <div className="text-2xl font-black text-slate-900 dark:text-white">{assignmentStats.total}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{assignmentStats.published}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Published</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{assignmentStats.dueSoon}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Due Soon</div>
              </div>
              {isEducator && (
                <>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{assignmentStats.draft}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Draft</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                    <div className="text-2xl font-black text-slate-600 dark:text-slate-400">{assignmentStats.closed}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Closed</div>
                  </div>
                </>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assignments..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
              
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                <option value="all">All Classes</option>
                {isEducator ? userClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                )) : joinedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.map((assignment, index) => {
              const dueDate = new Date(assignment.dueDate);
              const now = new Date();
              const isOverdue = dueDate < now;
              const isDueSoon = !isOverdue && (dueDate - now) < (1000 * 60 * 60 * 24 * 7);
              
              const submissionCount = assignment.submissions?.length || 0;
              const submissionRate = isEducator && assignment.assignedClass ? 
                Math.round((submissionCount / (userClasses.find(c => c.id === assignment.assignedClass)?.studentCount || 1)) * 100) : 0;

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="h-full p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-indigo-500/30 hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-2">{assignment.title}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={clsx(
                            "px-2 py-1 rounded-lg text-xs font-semibold",
                            assignment.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" :
                            assignment.status === "draft" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          )}>
                            {assignment.status === "published" ? "Published" : 
                             assignment.status === "draft" ? "Draft" : "Closed"}
                          </span>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 rounded-lg text-xs font-semibold">
                            {assignment.subject}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <span className={clsx(
                          "w-3 h-3 rounded-full",
                          isOverdue ? "bg-red-500" : isDueSoon ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        {isDueSoon && !isOverdue && (
                          <span className="absolute -inset-1 rounded-full bg-amber-500 animate-ping opacity-20" />
                        )}
                      </div>
                    </div>

                    {assignment.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">{assignment.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>Due: {dueDate.toLocaleDateString()}</span>
                      {isEducator && (
                        <span>{submissionCount} / {userClasses.find(c => c.id === assignment.assignedClass)?.studentCount || 1} submitted</span>
                      )}
                    </div>

                    {isEducator && (
                      <div className="mb-4">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, submissionRate)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {submissionRate}% submission rate
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/assignments/${assignment.id}`}
                        className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                      >
                        {isEducator ? "Manage" : "View"}
                      </Link>
                      
                      {isEducator && (
                        <>
                          {assignment.status === "draft" && (
                            <button
                              onClick={() => handlePublishAssignment(assignment.id)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl font-semibold text-sm hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredAssignments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-4xl">
                📋
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                {isEducator ? "No assignments found" : "No assignments available"}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
                {isEducator 
                  ? "Create your first assignment to start managing student work and providing feedback."
                  : "Check back later for new assignments from your teachers."
                }
              </p>
              {isEducator && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Create Your First Assignment
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Create Assignment Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Assignment</h2>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Assignment Title</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="e.g., Fractions Quiz #1"
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                    <select
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Grade Level</label>
                    <select
                      value={newAssignment.gradeLevel}
                      onChange={(e) => setNewAssignment({ ...newAssignment, gradeLevel: e.target.value })}
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
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Assign to Class</label>
                  <select
                    value={newAssignment.assignedClass}
                    onChange={(e) => setNewAssignment({ ...newAssignment, assignedClass: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    <option value="">Select Class</option>
                    {userClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Detailed instructions for students..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Assignment Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "assignment", label: "Assignment" },
                      { value: "quiz", label: "Quiz" },
                      { value: "project", label: "Project" }
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setNewAssignment({ ...newAssignment, type: type.value })}
                        className={clsx(
                          "px-4 py-2 rounded-xl font-semibold text-sm transition-all",
                          newAssignment.type === type.value
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Question Generation */}
                <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      🤖 AI-Powered Questions
                    </h3>
                    <button
                      onClick={generateQuestionsWithAI}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                    >
                      {newAssignment.aiGenerate ? "Regenerate" : "Generate Questions"}
                    </button>
                  </div>
                  
                  {newAssignment.questions.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        AI-generated questions based on your assignment details:
                      </div>
                      {newAssignment.questions.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{q.question}</p>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Type: {q.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAssignment}
                    disabled={!newAssignment.title || !newAssignment.description || !newAssignment.assignedClass}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Assignment
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