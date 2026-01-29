// Demo Data Generator for Unverified Users
// This provides realistic preview data for students, teachers, and parents

export function generateDemoData(role) {
    const commonData = {
        isDemo: true,
        demoMessage: "This is preview data. Verify your account to access real features."
    };

    if (role === 'student') {
        return {
            ...commonData,
            joinedClasses: [
                {
                    name: "Math 101 - Advanced Algebra",
                    code: "DEMO01",
                    subject: "Mathematics",
                    level: "Grade 10",
                    country: "United States",
                    teacherName: "Ms. Johnson",
                    locked: true
                },
                {
                    name: "Physics 201 - Mechanics",
                    code: "DEMO02",
                    subject: "Physics",
                    level: "Grade 11",
                    country: "United States",
                    teacherName: "Mr. Smith",
                    locked: true
                },
                {
                    name: "Chemistry - Organic Compounds",
                    code: "DEMO03",
                    subject: "Chemistry",
                    level: "Grade 10",
                    country: "United States",
                    teacherName: "Dr. Lee",
                    locked: true
                }
            ],
            assignments: [
                {
                    id: "demo_a1",
                    title: "Quadratic Equations Practice",
                    description: "Solve problems using the quadratic formula",
                    dueDate: "2026-02-15",
                    classCode: "DEMO01",
                    status: "pending",
                    locked: true
                },
                {
                    id: "demo_a2",
                    title: "Newton's Laws Lab Report",
                    description: "Write a detailed analysis of the pendulum experiment",
                    dueDate: "2026-02-18",
                    classCode: "DEMO02",
                    status: "pending",
                    locked: true
                },
                {
                    id: "demo_a3",
                    title: "Organic Molecules Research",
                    description: "Research and present on three organic compounds",
                    dueDate: "2026-02-20",
                    classCode: "DEMO03",
                    status: "submitted",
                    locked: true
                },
                {
                    id: "demo_a4",
                    title: "Algebra Word Problems",
                    description: "Complete worksheet pages 45-50",
                    dueDate: "2026-02-10",
                    classCode: "DEMO01",
                    status: "pending",
                    locked: true
                },
                {
                    id: "demo_a5",
                    title: "Bonding Types Quiz",
                    description: "Review ionic, covalent, and metallic bonding",
                    dueDate: "2026-02-12",
                    classCode: "DEMO03",
                    status: "pending",
                    locked: true
                }
            ],
            stats: {
                totalAssignments: 5,
                completedAssignments: 1,
                avgScore: 87,
                studyStreak: 12
            }
        };
    }

    if (role === 'teacher') {
        return {
            ...commonData,
            classes: [
                {
                    id: "demo_c1",
                    name: "Physics 101 - Morning Section",
                    code: "DEMO_T1",
                    subject: "Physics",
                    level: "Grade 10",
                    country: "United States",
                    studentCount: 24,
                    locked: true
                },
                {
                    id: "demo_c2",
                    name: "Physics 102 - Afternoon Section",
                    code: "DEMO_T2",
                    subject: "Physics",
                    level: "Grade 10",
                    country: "United States",
                    studentCount: 19,
                    locked: true
                }
            ],
            students: [
                { name: "Emma Thompson", email: "emma.t@demo.com", class: "DEMO_T1", avgScore: 92, locked: true },
                { name: "Liam Chen", email: "liam.c@demo.com", class: "DEMO_T1", avgScore: 88, locked: true },
                { name: "Sophia Rodriguez", email: "sophia.r@demo.com", class: "DEMO_T1", avgScore: 95, locked: true },
                { name: "Noah Patel", email: "noah.p@demo.com", class: "DEMO_T1", avgScore: 81, locked: true },
                { name: "Olivia Williams", email: "olivia.w@demo.com", class: "DEMO_T1", avgScore: 89, locked: true },
                { name: "Ethan Brown", email: "ethan.b@demo.com", class: "DEMO_T2", avgScore: 93, locked: true },
                { name: "Ava Martinez", email: "ava.m@demo.com", class: "DEMO_T2", avgScore: 87, locked: true },
                { name: "Mason Davis", email: "mason.d@demo.com", class: "DEMO_T2", avgScore: 90, locked: true },
                { name: "Isabella Garcia", email: "isabella.g@demo.com", class: "DEMO_T2", avgScore: 85, locked: true },
                { name: "James Wilson", email: "james.w@demo.com", class: "DEMO_T2", avgScore: 91, locked: true },
                { name: "Charlotte Lee", email: "charlotte.l@demo.com", class: "DEMO_T1", avgScore: 88, locked: true },
                { name: "Benjamin Kim", email: "benjamin.k@demo.com", class: "DEMO_T1", avgScore: 86, locked: true },
                { name: "Amelia Anderson", email: "amelia.a@demo.com", class: "DEMO_T2", avgScore: 94, locked: true },
                { name: "Lucas Thomas", email: "lucas.t@demo.com", class: "DEMO_T2", avgScore: 82, locked: true },
                { name: "Mia Jackson", email: "mia.j@demo.com", class: "DEMO_T1", avgScore: 90, locked: true }
            ],
            assignments: [
                {
                    id: "demo_ta1",
                    title: "Newton's Laws Practice",
                    classCode: "DEMO_T1",
                    dueDate: "2026-02-15",
                    submissions: 18,
                    locked: true
                },
                {
                    id: "demo_ta2",
                    title: "Energy Conservation Quiz",
                    classCode: "DEMO_T2",
                    dueDate: "2026-02-18",
                    submissions: 15,
                    locked: true
                }
            ]
        };
    }

    if (role === 'parent') {
        return {
            ...commonData,
            children: [
                {
                    name: "Alex Johnson",
                    grade: "Grade 10",
                    classes: 5,
                    avgScore: 89,
                    recentActivity: "Submitted Physics Lab Report",
                    locked: true
                },
                {
                    name: "Sarah Johnson",
                    grade: "Grade 8",
                    classes: 6,
                    avgScore: 93,
                    recentActivity: "Completed Math Quiz (95%)",
                    locked: true
                }
            ]
        };
    }

    return commonData;
}

export function DemoModeBanner({ isDemo }) {
    if (!isDemo) return null;
    return (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest shadow-lg relative z-50">
            <span>✨ Preview Mode: You are viewing demo data.</span>
            <a href="/verify" className="ml-4 underline hover:text-indigo-200 transition-colors">Verify Account →</a>
        </div>
    );
}
