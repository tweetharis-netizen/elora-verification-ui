
// lib/demo-data.js
// Rich demo data for the Elora Unified Ecosystem

export const DEMO_SCENARIO = {
    // Teacher Persona
    teacher: {
        name: "Mrs. Anderson",
        role: "educator",
        verified: true,
        teacher: true,
        classroom: {
            name: "Anderson's Academy",
            classes: [
                {
                    id: "cls_science_101",
                    name: "Advanced Physics",
                    joinCode: "PHYS-2024",
                    studentCount: 12,
                    color: "emerald",
                    schedule: "Mon/Wed 10:00 AM"
                },
                {
                    id: "cls_math_101",
                    name: "Algebra II",
                    joinCode: "MATH-2024",
                    studentCount: 24,
                    color: "blue",
                    schedule: "Tue/Thu 1:00 PM"
                }
            ],
            assignments: [
                {
                    id: "asgn_001",
                    title: "Newton's Laws Reflection",
                    description: "Write a short paragraph explaining the 3rd law.",
                    dueDate: "2024-12-15",
                    classCode: "PHYS-2024",
                    status: "active"
                }
            ],
            quizzes: [
                {
                    id: "quiz_001",
                    title: "Kinematics Basics",
                    questionCount: 5,
                    classCode: "PHYS-2024"
                }
            ],
            resources: [
                {
                    id: "res_001",
                    title: "Physics Formula Sheet.pdf",
                    type: "pdf",
                    url: "#",
                    classCode: "PHYS-2024"
                }
            ]
        }
    },

    // Student Persona
    student: {
        name: "Alex",
        role: "student",
        level: "High School",
        joinedClasses: [
            {
                id: "cls_science_101",
                name: "Advanced Physics",
                joinCode: "PHYS-2024",
                teacherName: "Mrs. Anderson"
            }
        ],
        usage: {
            messagesSent: 142,
            activeMinutes: 320,
            streak: 5,
            subjects: ["Physics", "Math"],
            lastActive: new Date().toISOString()
        },
        classroom: {
            submissions: [
                {
                    id: "sub_001",
                    assignmentId: "asgn_001",
                    content: "Action and reaction are equal and opposite...",
                    score: 92,
                    feedback: "Excellent understanding, Alex!",
                    date: new Date().toISOString()
                }
            ]
        }
    },

    // Parent Persona
    parent: {
        name: "Sarah (Alex's Mom)",
        role: "parent",
        linkedStudents: [
            {
                id: "stu_alex",
                name: "Alex",
                code: "ALEX-123",
                classCode: "PHYS-2024", // Links Alex to Mrs. Anderson's class
                stats: {
                    activeMinutes: 320,
                    subjects: ["Physics", "Math"],
                    recentScore: 92
                }
            }
        ],
        usage: {
            lastActive: new Date().toISOString()
        }
    }
};

export function getDemoSession(role = "student") {
    const base = DEMO_SCENARIO[role] || DEMO_SCENARIO.student;
    
    // Merge everything into a single session object for the "Unified" view
    // In a real app, these would be separate, but for the demo we want data continuity
    // if the user switches tabs on the same machine.
    return {
        ...base,
        hasSession: true,
        // Include data from other roles so switching preserves the "world"
        classroom: {
            ...DEMO_SCENARIO.teacher.classroom,
            ...base.classroom
        },
        linkedStudents: DEMO_SCENARIO.parent.linkedStudents,
        joinedClasses: DEMO_SCENARIO.student.joinedClasses
    };
}
