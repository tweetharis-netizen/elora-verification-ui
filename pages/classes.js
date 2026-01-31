import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import { motion } from "framer-motion";

const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Other"];
const GRADES = {
  "Singapore": ["Primary 1-6", "Secondary 1-4", "Junior College 1-2"],
  "United States": ["Elementary K-5", "Middle School 6-8", "High School 9-12"],
  "United Kingdom": ["Key Stage 1-2", "Key Stage 3-4", "GCSE", "A-Level"],
  "Other": ["Grade 1-3", "Grade 4-6", "Grade 7-9", "Grade 10-12"]
};

const SUBJECTS = ["Math", "Science", "English", "History", "Geography", "Computing", "Physics", "Chemistry", "Biology"];

function ClassCard({ classData, onDelete, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl hover:shadow-2xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{classData.name}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black">
              {classData.subject}
            </span>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black">
              {classData.grade}
            </span>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black">
              {classData.studentCount} students
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {classData.country} • {classData.code}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(classData)}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-indigo-500 transition-colors"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(classData.id)}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="flex gap-3 mt-4">
        <Link
          href={`/assignments?classId=${classData.id}`}
          className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-colors"
        >
          View Assignments
        </Link>
        <Link
          href={`/grades?classId=${classData.id}`}
          className="flex-1 text-center py-2 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black hover:bg-indigo-50 transition-colors"
        >
          View Progress
        </Link>
      </div>
    </motion.div>
  );
}

function CreateClassModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "Math",
    grade: "",
    country: "Singapore",
    description: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.grade) return;
    
    setIsCreating(true);
    
    // Simulate API call
    setTimeout(() => {
      const newClass = {
        id: `class_${Date.now()}`,
        ...formData,
        studentCount: 0,
        createdAt: new Date().toISOString()
      };
      onSave(newClass);
      setFormData({ name: "", subject: "Math", grade: "", country: "Singapore", description: "" });
      setIsCreating(false);
      onClose();
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Create New Class</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-red-500">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Class Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
              placeholder="e.g., Grade 10 Physics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Grade Level</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                required
              >
                <option value="">Select grade</option>
                {(GRADES[formData.country] || GRADES["Other"]).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Country</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
              placeholder="Brief description of the class..."
            />
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
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ClassesPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentSession = getSession();
    setSession(currentSession);
    
    // Load classes from localStorage or session
    if (currentSession?.classroom?.classes) {
      setClasses(currentSession.classroom.classes);
    } else {
      // Demo data for verified users
      if (currentSession?.verified) {
        const demoClasses = [
          {
            id: "class_1",
            name: "Grade 10 Physics",
            subject: "Physics",
            grade: "Grade 10",
            country: "United States",
            code: "PHY-10A",
            studentCount: 24,
            createdAt: new Date().toISOString()
          },
          {
            id: "class_2", 
            name: "Advanced Mathematics",
            subject: "Math",
            grade: "Grade 11",
            country: "United States",
            code: "MAT-11B",
            studentCount: 18,
            createdAt: new Date().toISOString()
          }
        ];
        setClasses(demoClasses);
      }
    }
  }, []);

  const handleCreateClass = (newClass) => {
    const updatedClasses = [...classes, newClass];
    setClasses(updatedClasses);
    
    // Save to session
    const currentSession = getSession();
    if (!currentSession.classroom) currentSession.classroom = {};
    currentSession.classroom.classes = updatedClasses;
    saveSession(currentSession);
  };

  const handleDeleteClass = (classId) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    
    const updatedClasses = classes.filter(c => c.id !== classId);
    setClasses(updatedClasses);
    
    // Update session
    const currentSession = getSession();
    if (currentSession?.classroom?.classes) {
      currentSession.classroom.classes = updatedClasses;
      saveSession(currentSession);
    }
  };

  const handleEditClass = (classData) => {
    // TODO: Implement edit modal
    alert("Edit functionality coming soon!");
  };

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>My Classes - Elora</title>
        <meta name="theme-color" content="#070b16" />
      </Head>

      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="elora-container pt-8 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">My Classes</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage your classes and track student progress
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span className="text-xl">+</span>
              Create Class
            </button>
          </div>

          {/* Classes Grid */}
          {classes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onDelete={handleDeleteClass}
                  onEdit={handleEditClass}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-3xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">No Classes Yet</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                Create your first class to start organizing your teaching and tracking student progress with Elora's AI-powered tools.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
              >
                Create Your First Class
              </button>
            </div>
          )}

          {/* AI Helper Section */}
          <div className="mt-16 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-3xl p-8 text-white text-center">
            <h3 className="text-2xl font-black mb-4">AI-Powered Teaching Tools</h3>
            <p className="mb-6 opacity-90 max-w-2xl mx-auto">
              Once you have classes set up, Elora can help you create assignments, generate quizzes, 
              provide personalized explanations, and track student mastery automatically.
            </p>
            <Link
              href="/assistant"
              className="inline-flex px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-colors"
            >
              Try AI Assistant
            </Link>
          </div>
        </div>
      </div>

      <CreateClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateClass}
      />
    </>
  );
}