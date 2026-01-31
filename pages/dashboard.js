import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getSession, isTeacher } from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  
  const userRole = session?.role || "student";
  const isEducator = useMemo(() => {
    const s = getSession();
    return s.role === "educator" || isTeacher();
  }, []);

  const roleSpecificData = useMemo(() => {
    const s = getSession();
    
    switch (userRole) {
      case "educator":
        return {
          title: "Educator Dashboard",
          subtitle: "Manage your classes and track student progress",
          stats: [
            { label: "Total Classes", value: s?.classroom?.classes?.length || 0, icon: "🏫", color: "indigo" },
            { label: "Total Students", value: s?.classroom?.classes?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0, icon: "👥", color: "emerald" },
            { label: "Active Assignments", value: s?.classroom?.assignments?.filter(a => a.status === "published").length || 0, icon: "📋", color: "purple" },
            { label: "Pending Submissions", value: s?.classroom?.submissions?.filter(sub => !sub.gradeAt).length || 0, icon: "⏳", color: "amber" }
          ],
          quickActions: [
            { href: "/assistant?action=assignment", label: "Create Assignment", icon: "➕", description: "Generate with AI assistance" },
            { href: "/classes", label: "Manage Classes", icon: "🏫", description: "View and edit your classes" },
            { href: "/assignments", label: "View All Assignments", icon: "📋", description: "See all assignments and submissions" },
            { href: "/assistant", label: "AI Assistant", icon: "💬", description: "Get help with lesson planning" }
          ]
        };
        
      case "student":
        return {
          title: "Student Dashboard",
          subtitle: "Track your learning progress and assignments",
          stats: [
            { label: "Completed Assignments", value: s?.usage?.completedAssignments || 0, icon: "✅", color: "emerald" },
            { label: "Current Streak", value: s?.usage?.streak || 0, icon: "🔥", color: "amber" },
            { label: "Study Minutes", value: s?.usage?.activeMinutes || 0, icon: "⏱️", color: "blue" },
            { label: "Subjects Explored", value: s?.usage?.subjects?.length || 0, icon: "📚", color: "purple" }
          ],
          quickActions: [
            { href: "/assistant", label: "AI Assistant", icon: "💬", description: "Get help with homework" },
            { href: "/assignments", label: "My Assignments", icon: "📝", description: "View and complete assignments" },
            { href: "/assistant?action=quiz", label: "Practice Quiz", icon: "🎯", description: "Test your knowledge" },
            { href: "/assistant?action=flashcards", label: "Study Cards", icon: "📇", description: "Review with flashcards" }
          ]
        };
        
      case "parent":
        return {
          title: "Parent Dashboard",
          subtitle: "Monitor your child's learning journey",
          stats: [
            { label: "Classes Joined", value: s?.joinedClasses?.length || 0, icon: "🏫", color: "indigo" },
            { label: "Recent Activity", value: s?.usage?.lastActive ? "Today" : "This week", icon: "📊", color: "emerald" },
            { label: "Avg. Assignment Score", value: "85%", icon: "⭐", color: "amber" },
            { label: "Study Streak", value: s?.usage?.streak || 0, icon: "🔥", color: "purple" }
          ],
          quickActions: [
            { href: "/assistant", label: "Learning Support", icon: "💬", description: "Get help explaining concepts" },
            { href: "/dashboard?view=progress", label: "Progress Report", icon: "📈", description: "View detailed progress" },
            { href: "/assistant?action=tutor", label: "Tutoring Tips", icon: "👨‍🏫", description: "Learn how to help effectively" },
            { href: "/assistant?role=parent", label: "Parent Resources", icon: "📱", description: "Communication tools and tips" }
          ]
        };
        
      default:
        return {
          title: "Dashboard",
          subtitle: "Track your progress and manage your learning",
          stats: [],
          quickActions: []
        };
    }
  }, [userRole, session]);

  const getColorClasses = (color) => {
    const colorMap = {
      indigo: "text-indigo-600 dark:text-indigo-400",
      emerald: "text-emerald-600 dark:text-emerald-400",
      amber: "text-amber-600 dark:text-amber-400",
      purple: "text-purple-600 dark:text-purple-400",
      blue: "text-blue-600 dark:text-blue-400"
    };
    return colorMap[color] || "text-slate-600 dark:text-slate-400";
  };

  return (
    <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20 overflow-x-hidden">
      <div className="elora-container pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {roleSpecificData.title}
            </h1>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              {roleSpecificData.subtitle}
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex justify-center gap-2 mb-8">
            {["educator", "student", "parent"].map((role) => (
              <button
                key={role}
                onClick={() => {
                  const s = getSession();
                  s.role = role;
                  setSession(s);
                  // Force a page reload to update the dashboard
                  window.location.reload();
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all",
                  userRole === role
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        {roleSpecificData.stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {roleSpecificData.stats.map((stat, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`text-3xl font-black ${getColorClasses(stat.color)}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>

                {/* Subtle hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roleSpecificData.quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={cn(
                  "group block p-6 rounded-2xl border transition-all duration-300",
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                  "hover:shadow-xl hover:scale-[1.02] hover:border-indigo-500/30"
                )}
              >
                <div className="text-center">
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {action.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {action.description}
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity / Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📊</span>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {session?.usage?.sessionLog?.slice(0, 5).map((log, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {log.action || "Activity"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {log.subject || "General"} • {new Date(log.ts).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )) || [
                <div key="empty" className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No recent activity
                </div>
              ]}
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🤖</span>
              AI Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  💡 Recommendation
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {isEducator 
                    ? "Consider using AI to generate differentiated assignments for your mixed-ability classroom."
                    : userRole === "student"
                      ? "Try practicing with AI-generated quizzes to improve retention."
                      : "Use AI explanations to help your child with difficult homework concepts."
                  }
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                  📈 Progress Trend
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {userRole === "student" 
                    ? "Your study streak is improving! Keep up the great work."
                    : isEducator
                      ? "Student engagement increased by 15% this week."
                      : "Your child has shown consistent progress in mathematics."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
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
            href="/assignments"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg"
          >
            <span>📋</span>
            <span className="font-medium">Assignments</span>
          </Link>
        </div>
      </div>
    </div>
  );
}