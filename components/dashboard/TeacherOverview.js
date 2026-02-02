// components/dashboard/TeacherOverview.js
// Main overview tab for the Teacher Dashboard

import { StatsCard, PerformanceHeatmap } from "./DashboardUI";

export default function TeacherOverview({ stats, students, classes, selectedClassId }) {
    // Determine active class if selected
    const activeClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;

    // Filtering students if a specific class is selected
    // Note: In the original logic, students were a flat list. 
    // We'll filter them if they have a classCode property or similar.
    const filteredStudents = selectedClassId
        ? students.filter(s => s.classCode === activeClass?.joinCode || s.classId === selectedClassId)
        : students;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    label="Active Students"
                    value={filteredStudents.length}
                    icon="👥"
                    trend="up"
                    trendValue="3 new"
                />
                <StatsCard
                    label={selectedClassId ? "Class Momentum" : "Total Learning"}
                    value={`${stats.totalHours || 0}h`}
                    icon="⏱️"
                />
                <StatsCard
                    label="Top Subject"
                    value={stats.topSubject || "Physics"}
                    icon="🧠"
                    trend="up"
                    trendValue="8% higher"
                />
            </div>

            {/* Mastery & Activity Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Subject Mastery Heatmap */}
                <div className="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-3xl p-8 border-premium shadow-premium-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Subject Mastery</h3>
                            <p className="text-sm text-neutral-500 mt-1">Class-wide performance distribution</p>
                        </div>
                    </div>
                    <div className="h-64 sm:h-80">
                        <PerformanceHeatmap data={stats.heatmapData} />
                    </div>
                </div>

                {/* Real-time Activity / Link Student */}
                <div className="lg:col-span-4 bg-white dark:bg-neutral-900 rounded-3xl p-8 border-premium shadow-premium-sm">
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-400">
                                        {s.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">{s.name}</p>
                                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                                            {s.stats?.subjects?.[0] || 'Learning...'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
                                <p className="text-xs font-bold text-neutral-400">No active students found</p>
                            </div>
                        )}
                    </div>

                    {!selectedClassId && (
                        <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-4">Pedagogical Insight</p>
                            <div className="bg-primary-50 dark:bg-primary-500/5 p-4 rounded-2xl border-premium border-primary-100 dark:border-primary-500/20">
                                <p className="text-xs text-primary-700 dark:text-primary-300 italic">
                                    "Your students are showing high engagement in Science, but might need support in Algebra."
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border-premium shadow-premium-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Student Roster</h3>
                    <button className="text-sm font-bold text-primary-600 hover:text-primary-700">Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="pb-4 pl-2">Name</th>
                                <th className="pb-4 text-center">Interactions</th>
                                <th className="pb-4 text-center">Focus Time</th>
                                <th className="pb-4 text-right">Momentum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                            {filteredStudents.map((s, i) => (
                                <tr key={i} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    <td className="py-4 pl-2 font-bold text-neutral-900 dark:text-neutral-50">{s.name}</td>
                                    <td className="py-4 text-sm text-neutral-500 text-center">{s.stats?.messagesSent || 0}</td>
                                    <td className="py-4 text-sm text-neutral-500 text-center">{s.stats?.activeMinutes || 0}m</td>
                                    <td className="py-4 text-right">
                                        <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-500/10 px-3 py-1 rounded-full">
                                            {s.stats?.subjects?.[0] || 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-neutral-400 font-bold italic">No students joined yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
