import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import Link from "next/link";
import { motion } from "framer-motion";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  
  const isEducator = session?.role === "educator" || session?.teacher;
  const assignmentId = router.query.id;
  
  const allAssignments = session?.classroom?.assignments || [];
  const userClasses = session?.classroom?.classes || [];
  const joinedClasses = session?.joinedClasses || [];
  const allSubmissions = session?.classroom?.submissions || [];

  // Find the assignment
  useEffect(() => {
    const foundAssignment = allAssignments.find(a => a.id === assignmentId);
    setAssignment(foundAssignment || null);
    
    // Find existing submission if student
    if (!isEducator && foundAssignment) {
      const existingSubmission = allSubmissions.find(s => 
        s.assignmentId === assignmentId && s.studentEmail === session.email
      );
      setSubmission(existingSubmission || null);
    }
  }, [assignmentId, allAssignments, isEducator, session.email, allSubmissions]);

  if (!assignment) {
    return (
      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Assignment Not Found</h1>
          <Link href="/assignments" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors">
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const handleEditAssignment = (updatedData) => {
    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      assignments: allAssignments.map(a => 
        a.id === assignment.id ? { ...a, ...updatedData, updatedAt: new Date().toISOString() } : a
      )
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setAssignment({ ...assignment, ...updatedData });
    setEditMode(false);
  };

  const handleDeleteAssignment = () => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      assignments: allAssignments.filter(a => a.id !== assignment.id)
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    router.push("/assignments");
  };

  const handleSubmitWork = () => {
    if (!submission || !submission.answers || Object.keys(submission.answers).length === 0) {
      alert("Please answer at least one question before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    const submissionData = {
      id: `sub_${Date.now()}`,
      assignmentId: assignment.id,
      studentEmail: session.email,
      studentName: session.email?.split('@')[0] || "Student",
      answers: submission.answers,
      submittedAt: new Date().toISOString(),
      status: "submitted"
    };

    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      submissions: [...allSubmissions.filter(s => !(s.assignmentId === assignmentId && s.studentEmail === session.email)), submissionData]
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setSubmission(submissionData);
    setIsSubmitting(false);
    
    // Simulate updating the assignment with new submission
    const updatedAssignment = {
      ...assignment,
      submissions: [...(assignment.submissions || []), submissionData]
    };
    
    const updatedSession2 = { ...updatedSession };
    updatedSession2.classroom = {
      ...updatedSession2.classroom,
      assignments: allAssignments.map(a => 
        a.id === assignment.id ? updatedAssignment : a
      )
    };
    
    saveSession(updatedSession2);
    setSession(updatedSession2);
  };

  const handleGradeSubmission = (submissionId, grade, feedback) => {
    const updatedSession = { ...session };
    updatedSession.classroom = {
      ...updatedSession.classroom,
      submissions: allSubmissions.map(s => 
        s.id === submissionId ? { ...s, grade, feedback, gradedAt: new Date().toISOString() } : s
      )
    };
    
    saveSession(updatedSession);
    setSession(updatedSession);
    
    // Update local submission if viewing one
    if (submission && submission.id === submissionId) {
      setSubmission({ ...submission, grade, feedback, gradedAt: new Date().toISOString() });
    }
  };

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const canSubmit = !isEducator && !submission && !isOverdue && assignment.status === "published";
  const canEdit = isEducator && (assignment.status === "draft" || assignment.status === "published");
  
  const submissionsForAssignment = allSubmissions.filter(s => s.assignmentId === assignmentId);
  const averageGrade = submissionsForAssignment.filter(s => s.grade).length > 0 
    ? Math.round(submissionsForAssignment.filter(s => s.grade).reduce((sum, s) => sum + s.grade, 0) / submissionsForAssignment.filter(s => s.grade).length)
    : null;

  return (
    <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <div className="elora-container pt-24 lg:pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/assignments" 
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                ← Back to Assignments
              </Link>
              <div className="flex gap-2">
                <span className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-semibold",
                  assignment.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" :
                  assignment.status === "draft" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                )}>
                  {assignment.status === "published" ? "Published" : 
                   assignment.status === "draft" ? "Draft" : "Closed"}
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 rounded-lg text-xs font-semibold">
                  {assignment.subject}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                  {assignment.gradeLevel}
                </span>
              </div>
              {canEdit && (
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                  >
                    Edit
                  </button>
                  {assignment.status === "published" && (
                    <button
                      onClick={() => handleEditAssignment({ status: "closed" })}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>

            {!editMode && (
              <>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 font-[var(--font-brand)]">
                  {assignment.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  {isOverdue && (
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 rounded-lg text-xs font-semibold">
                      Overdue
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {editMode ? (
            /* Edit Mode */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={assignment.title}
                  onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={assignment.description}
                  onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={assignment.dueDate}
                    onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Status</label>
                  <select
                    value={assignment.status}
                    onChange={(e) => setAssignment({ ...assignment, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditAssignment({})}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-8">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Instructions</h3>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{assignment.description}</p>
              </div>

              {/* Student View */}
              {!isEducator && (
                <div className="space-y-6">
                  {submission ? (
                    <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          ✓
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-300">Submitted Successfully</h3>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {submission.grade && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-2xl">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Grade: {submission.grade}%</h4>
                          {submission.feedback && (
                            <div>
                              <h5 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Feedback:</h5>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : canSubmit ? (
                    <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Submit Your Work</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Your Answers</label>
                          <textarea
                            value={submission?.answers || ""}
                            onChange={(e) => setSubmission({ ...submission, answers: e.target.value })}
                            placeholder="Enter your answers here..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                          />
                        </div>
                        <button
                          onClick={handleSubmitWork}
                          disabled={isSubmitting}
                          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Assignment"}
                        </button>
                      </div>
                    </div>
                  ) : isOverdue ? (
                    <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30">
                      <h3 className="text-xl font-black text-rose-700 dark:text-rose-300 mb-4">Assignment Overdue</h3>
                      <p className="text-rose-600 dark:text-rose-400">
                        This assignment was due on {new Date(assignment.dueDate).toLocaleDateString()} and is no longer accepting submissions.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                      <h3 className="text-xl font-black text-amber-700 dark:text-amber-300 mb-4">Assignment Not Available</h3>
                      <p className="text-amber-600 dark:text-amber-400">
                        This assignment is not currently accepting submissions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Educator View */}
              {isEducator && (
                <div className="space-y-6">
                  {/* Submissions Overview */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Submissions Overview</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{submissionsForAssignment.length}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Total Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{submissionsForAssignment.filter(s => s.grade).length}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Graded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{averageGrade || '-'}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Average Grade</div>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p><strong>Quick Stats:</strong></p>
                      <ul className="mt-2 space-y-1">
                        <li>• Submission rate: {Math.round((submissionsForAssignment.length / (userClasses.find(c => c.id === assignment.classId)?.studentCount || 1)) * 100)}%</li>
                        <li>• Pending grading: {submissionsForAssignment.length - submissionsForAssignment.filter(s => s.grade).length}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Individual Submissions */}
                  {submissionsForAssignment.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Individual Submissions</h3>
                      
                      {submissionsForAssignment.map((sub, index) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-black text-slate-900 dark:text-white">{sub.studentName}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {sub.grade && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-lg text-sm font-semibold">
                                  Grade: {sub.grade}%
                                </span>
                              )}
                              <button
                                onClick={() => setFeedbackMode(feedbackMode === sub.id ? null : sub.id)}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                              >
                                {sub.grade ? "Edit Feedback" : "Grade"}
                              </button>
                            </div>
                          </div>

                          <div className="text-slate-600 dark:text-slate-300 mb-4">
                            <p><strong>Answers:</strong></p>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm whitespace-pre-wrap">
                              {sub.answers}
                            </div>
                          </div>

                          {feedbackMode === sub.id && (
                            <div className="border-t border-slate-200 dark:border-white/5 pt-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Grade (0-100)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={sub.grade || ""}
                                    onChange={(e) => setSubmission({ ...sub, grade: parseInt(e.target.value) || "" })}
                                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Feedback</label>
                                  <textarea
                                    value={sub.feedback || ""}
                                    onChange={(e) => setSubmission({ ...sub, feedback: e.target.value })}
                                    placeholder="Provide constructive feedback..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                                  />
                                </div>
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => setFeedbackMode(null)}
                                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleGradeSubmission(sub.id, sub.grade, sub.feedback)}
                                    disabled={!sub.grade || sub.grade < 0 || sub.grade > 100}
                                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Save Grade & Feedback
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {sub.grade && sub.feedback && !feedbackMode && (
                            <div className="border-t border-slate-200 dark:border-white/5 pt-4">
                              <div>
                                <h5 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2">Teacher Feedback:</h5>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{sub.feedback}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {submissionsForAssignment.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                        📭
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">No submissions yet for this assignment.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}