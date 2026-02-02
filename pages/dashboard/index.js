// pages/dashboard/index.js
// Modernized high-performance dashboard for Students, Teachers, and Parents.
// Minimalist Premium Aesthetic (Linear/Stripe inspired)

import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

// Core Libs
import { getSession, saveSession } from "../../lib/session";
import { generateDemoData, DemoModeBanner } from "../../lib/demoData";

// Components
import ErrorBoundary from "../../components/ErrorBoundary";
import { NotificationProvider, notify } from "../../components/Notifications";
import { SubmissionModal } from "../../components/SubmissionModal";
import { GradingModal } from "../../components/GradingModal";

// Dashboard Modules & UI
import StudentModule from "../../components/dashboard/StudentModule";
import TeacherModule from "../../components/dashboard/TeacherModule";
import ParentModule from "../../components/dashboard/ParentModule";
import { PreviewBanner } from "../../components/dashboard/DashboardShared";

// Utils
import {
    deriveStudentStats,
    computeClassMetrics,
    generateJoinCode
} from "../../lib/dashboard-utils";

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("student");
    const [linkedData, setLinkedData] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);

    // Feature States
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [activeSubmission, setActiveSubmission] = useState(null);

    // 1. Lifecycle: Sync Session
    useEffect(() => {
        setHasMounted(true);
        const sync = () => {
            const s = getSession();
            setSession({ ...s });
        };

        const s = getSession();
        if (!s || !s.email) {
            router.push('/login');
            return;
        }

        setSession(s);
        setIsDemoMode(!s.verified);

        // Default Tab based on role
        if (s.role === 'parent') setActiveTab('parent');
        else if (s.role === 'educator') setActiveTab('teacher');
        else setActiveTab('student');

        setLoading(false);
        window.addEventListener("elora:session", sync);
        return () => window.removeEventListener("elora:session", sync);
    }, [router]);

    // 2. Data Preparation
    const demoData = useMemo(() => {
        if (!isDemoMode || !session) return null;
        return generateDemoData(session.role || 'student');
    }, [isDemoMode, session]);

    const studentData = useMemo(() => {
        return session ? deriveStudentStats(session) : null;
    }, [session]);

    const teacherMetrics = useMemo(() => {
        return session ? computeClassMetrics(session.linkedStudents, session.verified, hasMounted) : null;
    }, [session, hasMounted]);

    // 3. Handlers
    const updateSessionAndSync = (newSession) => {
        saveSession(newSession);
        setSession({ ...newSession });
        notify("Dashboard updated", "success");
    };

    const handleLinkStudent = (code) => {
        const s = { ...session };
        s.linkedStudentId = code;
        updateSessionAndSync(s);

        // Mocking student data for demo
        setLinkedData({
            name: "Alexander Smith",
            streak: 12,
            todayMinutes: 45,
            overallProgress: 78,
            subjectBreakdown: [85, 92, 70, 88],
            subjectLabels: ["Math", "Physics", "English", "History"],
            recentActivity: [
                { action: "Solved 'Quantum Entanglement' Problem Set", time: "2h ago" },
                { action: "Completed AI Strategy Session", time: "5h ago" }
            ]
        });
    };

    const handleDisconnectStudent = () => {
        const s = { ...session };
        delete s.linkedStudentId;
        updateSessionAndSync(s);
        setLinkedData(null);
    };

    // 4. Render Loading
    if (loading || !session) {
        return (
            <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <NotificationProvider>
                <Head><title>Elora | Intelligent Dashboard</title></Head>

                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500 pb-20">
                    <DemoModeBanner isDemo={isDemoMode} />

                    <div className="max-w-7xl mx-auto px-6 pt-12">
                        {isDemoMode && <PreviewBanner />}

                        {/* Persona Switcher (Only for multi-role accounts or debug) */}
                        <div className="flex justify-center mb-12">
                            <div className="bg-white dark:bg-neutral-900 p-1 rounded-2xl border-premium shadow-premium-sm flex gap-1">
                                {['student', 'parent', 'teacher'].filter(id => {
                                    if (id === 'teacher' && session.role === 'educator') return true;
                                    return id === session.role;
                                }).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setActiveTab(role)}
                                        className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === role
                                            ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 shadow-premium-md"
                                            : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                            }`}
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)} View
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            >
                                {activeTab === 'student' && (
                                    <StudentModule
                                        data={studentData}
                                        session={session}
                                        onUpdateSession={updateSessionAndSync}
                                        isDemoMode={isDemoMode}
                                        demoData={demoData}
                                        isSubmitting={isSubmitting}
                                        setIsSubmitting={setIsSubmitting}
                                        setActiveAssignment={setActiveAssignment}
                                        onStartQuiz={(quiz) => router.push(`/assistant?quiz=${quiz.id}`)}
                                    />
                                )}

                                {activeTab === 'teacher' && (
                                    <TeacherModule
                                        students={session.linkedStudents || []}
                                        metrics={teacherMetrics}
                                        session={session}
                                        onUpdateSession={updateSessionAndSync}
                                        isDemoMode={isDemoMode}
                                        demoData={demoData}
                                        router={router}
                                    />
                                )}

                                {activeTab === 'parent' && (
                                    <ParentModule
                                        linkedStudentId={session.linkedStudentId}
                                        linkedData={linkedData}
                                        onLinkStudent={handleLinkStudent}
                                        onDisconnect={handleDisconnectStudent}
                                        isVerified={session.verified}
                                        session={session}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Modals from Core */}
                    <AnimatePresence>
                        {isSubmitting && (
                            <SubmissionModal
                                assignment={activeAssignment}
                                isOpen={isSubmitting}
                                onClose={() => setIsSubmitting(false)}
                                onSubmit={() => {
                                    notify("Submission received", "success");
                                    setIsSubmitting(false);
                                }}
                            />
                        )}
                        {isGrading && (
                            <GradingModal
                                submission={activeSubmission}
                                assignment={activeAssignment}
                                isOpen={isGrading}
                                onClose={() => setIsGrading(false)}
                                onSaveGrade={() => {
                                    notify("Grade recorded", "success");
                                    setIsGrading(false);
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </NotificationProvider>
        </ErrorBoundary>
    );
}
