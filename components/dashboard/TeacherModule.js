// components/dashboard/TeacherModule.js
// Modernized Teacher Module with Minimalist Premium aesthetic

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TeacherSidebar from "./TeacherSidebar";
import TeacherOverview from "./TeacherOverview";
import ClassWizard from "./ClassWizard";
import TeacherVideoExplorer from "./TeacherVideoExplorer";
import AssignmentWizard from "./AssignmentWizard";
import QuizGenerator from "./QuizGenerator";
import VoiceAssistant from "./VoiceAssistant";
import { Greeting } from "./DashboardUI";
import { generateJoinCode } from "../../lib/dashboard-utils";

export default function TeacherModule({
    students,
    metrics,
    onAddStudent,
    session: activeSession,
    onUpdateSession,
    isDemoMode,
    demoData,
    router
}) {
    if (!activeSession) return null;

    const [selectedTab, setSelectedTab] = useState("overview");
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isAssignmentWizardOpen, setIsAssignmentWizardOpen] = useState(false);
    const [isQuizGeneratorOpen, setIsQuizGeneratorOpen] = useState(false);
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const classes = activeSession?.classroom?.classes || [];
    const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

    const handleSaveClass = (formData) => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = { classes: [] };
        if (!nextSession.classroom.classes) nextSession.classroom.classes = [];

        if (editingClass) {
            // Update existing
            nextSession.classroom.classes = nextSession.classroom.classes.map(c =>
                c.id === editingClass.id ? { ...c, ...formData } : c
            );
        } else {
            // Create new
            const newClass = {
                id: `cls_${Date.now()}`,
                joinCode: generateJoinCode(),
                studentCount: 0,
                color: "neutral",
                ...formData
            };
            nextSession.classroom.classes.push(newClass);
        }

        onUpdateSession(nextSession);
        setIsWizardOpen(false);
        setEditingClass(null);
    };

    const handleDeleteClass = (id) => {
        const cls = classes.find(c => c.id === id);
        if (!cls) return;

        if (window.confirm(`Are you sure you want to delete "${cls.name}"? This action cannot be undone.`)) {
            const nextSession = { ...activeSession };
            nextSession.classroom.classes = nextSession.classroom.classes.filter(c => c.id !== id);
            onUpdateSession(nextSession);
            if (selectedClassId === id) setSelectedClassId(null);
        }
    };

    const handlePostResource = (resource) => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom.resources) nextSession.classroom.resources = [];
        nextSession.classroom.resources.push({ ...resource, id: `res_${Date.now()}` });
        onUpdateSession(nextSession);
    };

    const handleApplyVoicePlan = (plan) => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom.assignments) nextSession.classroom.assignments = [];
        nextSession.classroom.assignments.push({
            id: `asgn_${Date.now()}`,
            title: plan.title,
            description: plan.segments.map(s => `${s.time}: ${s.activity}`).join("\n"),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            classCode: selectedClass?.joinCode || "ALL"
        });
        onUpdateSession(nextSession);
    };

    const handleOpenSettings = (cls) => {
        setEditingClass(cls);
        setIsWizardOpen(true);
    };

    const handleStartCreateClass = () => {
        setEditingClass(null);
        setIsWizardOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <Greeting name={activeSession.name} role="Educator" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar Navigation */}
                <TeacherSidebar
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    classes={classes}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    onOpenSettings={handleOpenSettings}
                    onDeleteClass={handleDeleteClass}
                    onStartCreateClass={handleStartCreateClass}
                    onOpenQuizGen={() => setIsQuizGeneratorOpen(true)}
                    onOpenVoice={() => setIsVoiceAssistantOpen(true)}
                />

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 w-full">
                    <AnimatePresence mode="wait">
                        {selectedTab === "overview" && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <TeacherOverview
                                    stats={metrics}
                                    students={students}
                                    classes={classes}
                                    selectedClassId={selectedClassId}
                                />
                            </motion.div>
                        )}

                        {selectedTab === "assignments" && (
                            <AssignmentWizard
                                isOpen={true}
                                onClose={() => setSelectedTab("overview")}
                                classes={classes}
                                onSave={(assignment) => {
                                    const nextSession = { ...activeSession };
                                    if (!nextSession.classroom.assignments) nextSession.classroom.assignments = [];
                                    nextSession.classroom.assignments.push({ ...assignment, id: `asgn_${Date.now()}` });
                                    onUpdateSession(nextSession);
                                }}
                            />
                        )}

                        {selectedTab === "insights" && (
                            <TeacherVideoExplorer
                                selectedClass={selectedClass}
                                onPostResource={handlePostResource}
                            />
                        )}

                        {selectedTab === "submissions" && (
                            <motion.div
                                key="coming-soon"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-12 border-premium text-center"
                            >
                                <div className="text-4xl mb-6">✨</div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Automated Grading</h3>
                                <p className="text-neutral-500 max-w-sm mx-auto mb-8">
                                    Elora is analyzing student work in the background. Automated grading and feedback summaries will appear here.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <ClassWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSave={handleSaveClass}
                editingClass={editingClass}
            />

            <QuizGenerator
                isOpen={isQuizGeneratorOpen}
                onClose={() => setIsQuizGeneratorOpen(false)}
                selectedClass={selectedClass}
                onSave={(quiz) => {
                    const nextSession = { ...activeSession };
                    if (!nextSession.classroom.quizzes) nextSession.classroom.quizzes = [];
                    nextSession.classroom.quizzes.push(quiz);
                    onUpdateSession(nextSession);
                }}
            />

            <VoiceAssistant
                isOpen={isVoiceAssistantOpen}
                onClose={() => setIsVoiceAssistantOpen(false)}
                onApplyPlan={handleApplyVoicePlan}
            />
        </div>
    );
}
