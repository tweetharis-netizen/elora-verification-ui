import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { getSession, isTeacher } from "@/lib/session";
import Link from "next/link";

const ROLE_DASHBOARD_CONFIG = {
  educator: {
    title: "Teacher Dashboard",
    subtitle: "Manage classes, assignments, and track student progress",
    primaryActions: [
      { label: "Create Class", href: "/classes", icon: "➕", color: "from-indigo-600 to-purple-600" },
      { label: "New Assignment", href: "/assignments", icon: "📝", color: "from-purple-600 to-pink-600" },
      { label: "AI Assistant", href: "/assistant", icon: "🤖", color: "from-emerald-600 to-teal-600" }
    ],
    stats: [
      { key: "classes", label: "Active Classes", icon: "📚" },
      { key: "students", label: "Total Students", icon: "👥" },
      { key: "assignments", label: "Assignments", icon: "📋" },
      { key: "submissions", label: "Pending Review", icon: "⏳" }
    ]
  },
  student: {
    title: "Student Dashboard", 
    subtitle: "Track your progress and complete assignments",
    primaryActions: [
      { label: "My Assignments", href: "/assignments", icon: "📝", color: "from-blue-600 to-indigo-600" },
      { label: "AI Tutor", href: "/assistant", icon: "🤖", color: "from-emerald-600 to-teal-600" },
      { label: "Progress", href: "/progress", icon: "📈", color: "from-purple-600 to-pink-600" }
    ],
    stats: [
      { key: "completed", label: "Completed", icon: "✅" },
      { key: "pending", label: "Pending", icon: "⏳" },
      { key: "streak", label: "Day Streak", icon: "🔥" },
      { key: "points", label: "Points", icon: "⭐" }
    ]
  },
  parent: {
    title: "Parent Dashboard",
    subtitle: "Monitor your child's learning progress", 
    primaryActions: [
      { label: "Progress Report", href: "/progress", icon: "📊", color: "from-blue-600 to-indigo-600" },
      { label: "AI Assistant", href: "/assistant", icon: "🤖", color: "from-emerald-600 to-teal-600" },
      { label: "Messages", href: "/messages", icon: "💬", color: "from-purple-600 to-pink-600" }
    ],
    stats: [
      { key: "overall", label: "Overall Progress", icon: "📈" },
      { key: "weekActivity", label: "This Week", icon: "📅" },
      { key: "strengths", label: "Strength Areas", icon: "💪" },
      { key: "focus", label: "Needs Support", icon: "🎯" }
    ]
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [role, setRole] = useState(() => session?.role || "student");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const config = ROLE_DASHBOARD_CONFIG[role] || ROLE_DASHBOARD_CONFIG.student;

  // Calculate mock stats based on session data
  const getStatValue = (key) => {
    const sessionData = session || {};
    switch (key) {
      case "classes":
        return sessionData.classes?.length || 0;
      case "students":
        return sessionData.classes?.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) || 0;
      case "assignments":
        return sessionData.classes?.reduce((sum, cls) => sum + (cls.assignments?.length || 0), 0) || 0;
      case "submissions":
        return Math.floor(Math.random() * 10) + 1; // Mock data
      case "completed":
        return Math.floor(Math.random() * 20) + 5;
      case "pending":
        return Math.floor(Math.random() * 5) + 1;
      case "streak":
        return Math.floor(Math.random() * 15) + 1;
      case "points":
        return Math.floor(Math.random() * 500) + 100;
      case "overall":
        return `${Math.floor(Math.random() * 30) + 70}%`;
      case "weekActivity":
        return `${Math.floor(Math.random() * 10) + 2} hours`;
      case "strengths":
        return Math.floor(Math.random() * 5) + 3;
      case "focus":
        return Math.floor(Math.random() * 2) + 1;
      default:
        return 0;
    }
  };

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {config.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {config.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {session.email?.split('@')[0] || "Guest"}
                </p>
              </div>
              {session.verified && (
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.primaryActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Link href={action.href}>
                  <div className={`bg-gradient-to-r ${action.color} p-6 rounded-3xl text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{action.icon}</span>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">→</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{action.label}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.stats.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {getStatValue(stat.key)}
                    </p>
                  </div>
                  <div className="text-3xl">{stat.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity / Quick Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Recent Activity */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: "📝", title: "Math Quiz completed", time: "2 hours ago", color: "text-emerald-500" },
                { icon: "🎯", title: "New assignment posted", time: "5 hours ago", color: "text-blue-500" },
                { icon: "🤖", title: "AI tutoring session", time: "1 day ago", color: "text-purple-500" },
                { icon: "✅", title: "Homework submitted", time: "2 days ago", color: "text-green-500" }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">Learning Momentum</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Student is showing strong progress in Mathematics. Consider advancing to next level.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎯</span>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">Focus Area</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Additional practice recommended for fractions and decimals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🚀</span>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">Next Steps</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Ready for challenge problems? Try advanced exercises.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
            <p className="text-white/80 mb-6">
              Your AI assistant is ready to help with lesson planning, student questions, and more.
            </p>
            <Link href="/assistant">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-white text-indigo-600 font-black rounded-2xl hover:shadow-xl transition-all"
              >
                Open AI Assistant
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}