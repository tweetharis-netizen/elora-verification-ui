import { useMemo } from "react";
import Link from "next/link";
 
import { LineChart } from "./SimpleCharts";

 

export default function DashboardPreview({ role = "all" }) {
    const modules = [
        {
            title: "Student Progress",
            subtitle: "Real-time learning momentum",
            chartData: [40, 55, 48, 62, 75, 82],
        },
        {
            title: "Parent Insights",
            subtitle: "Weekly activity breakdown",
            stats: [
                { value: "A+", label: "Grade" },
                { value: "↑15%", label: "Growth" },
            ],
        },
        {
            title: "Teacher Automations",
            subtitle: "3.5 hours saved this week",
            stats: [
                { value: "2.5h", label: "Saved" },
                { value: "48", label: "Tasks" },
            ],
        },
    ];

    // Filter modules based on role
    const filteredModules = useMemo(() => {
        if (!role || role === "all") return modules;
        if (role === "student") return modules.filter(m => m.title.includes("Student"));
        if (role === "educator") return modules.filter(m => m.title.includes("Teacher"));
        if (role === "parent") return modules.filter(m => m.title.includes("Parent"));
        return modules;
    }, [role, modules]);

    return (
        <section className="p-6">
            <header className="mb-4">
                <h3 className="text-xl font-semibold text-text-primary">Dashboard Preview</h3>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredModules.map((m, index) => (
                    <article key={index} className="elora-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-text-primary">{m.title}</p>
                            <span className="text-xs text-text-secondary">{m.subtitle}</span>
                        </div>
                        {m.chartData ? (
                            <div className="h-12">
                                <LineChart data={m.chartData} color="neutral" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                {(m.stats || []).map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-base font-semibold text-text-primary">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs text-text-secondary uppercase tracking-wider">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                            <Link className="elora-btn elora-btn-primary" href="/dashboard">Open</Link>
                            <Link className="elora-btn elora-btn-secondary" href="/dashboard">Details</Link>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
