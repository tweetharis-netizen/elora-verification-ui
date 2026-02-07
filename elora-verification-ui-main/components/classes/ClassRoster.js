// components/classes/ClassRoster.js
// Student roster management with attendance and behavioral tracking

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ClassRoster({
    classData,
    students = [],
    onAddStudent,
    onRemoveStudent,
    onMarkAttendance,
    onAddBehavioralNote,
    isTeacher = true
}) {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBehaviorModal, setShowBehaviorModal] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [view, setView] = useState('list'); // list, attendance, seating

    // Get today's attendance
    const todayAttendance = classData?.attendance?.[attendanceDate] || {};

    const toggleAttendance = (studentId) => {
        const currentStatus = todayAttendance[studentId] || 'absent';
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        onMarkAttendance(attendanceDate, studentId, newStatus);
    };

    // Calculate attendance stats
    const calculateAttendanceRate = (studentId) => {
        const attendance = classData?.attendance || {};
        const records = Object.values(attendance).map(day => day[studentId]);
        const presentCount = records.filter(s => s === 'present').length;
        return records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Class Roster</h2>
                    <p className="text-text-secondary mt-1">{students.length} student{students.length !== 1 ? 's' : ''}</p>
                </div>

                {isTeacher && (
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                        </button>
                    </div>
                )}
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 border-b border-border-primary">
                <button
                    onClick={() => setView('list')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${view === 'list'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    List View
                </button>
                <button
                    onClick={() => setView('attendance')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${view === 'attendance'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Attendance
                </button>
                {isTeacher && (
                    <button
                        onClick={() => setView('seating')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${view === 'seating'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Seating Chart
                    </button>
                )}
            </div>

            {/* List View */}
            {view === 'list' && (
                <div className="grid grid-cols-1 gap-3">
                    {students.map((student, idx) => {
                        const attendanceRate = calculateAttendanceRate(student.id);
                        const behavioralNotes = classData?.behavioralNotes?.[student.id] || [];

                        return (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="card p-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {student.name?.charAt(0) || '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary truncate">{student.name}</h3>
                                        <p className="text-sm text-text-secondary truncate">{student.email}</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className={`text-lg font-bold ${attendanceRate >= 90 ? 'text-secondary-600' :
                                                    attendanceRate >= 75 ? 'text-warning' : 'text-error'
                                                }`}>
                                                {attendanceRate}%
                                            </div>
                                            <div className="text-xs text-text-tertiary">Attendance</div>
                                        </div>

                                        {isTeacher && behavioralNotes.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setShowBehaviorModal(true);
                                                }}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                {behavioralNotes.length}
                                            </button>
                                        )}

                                        {isTeacher && (
                                            <button
                                                onClick={() => onRemoveStudent(student.id)}
                                                className="btn btn-sm btn-ghost text-error hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Attendance View */}
            {view === 'attendance' && (
                <div className="space-y-4">
                    {isTeacher && (
                        <div className="flex items-center gap-3">
                            <label className="font-medium text-text-secondary">Date:</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="input"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {students.map((student) => {
                            const status = todayAttendance[student.id] || 'absent';
                            const isPresent = status === 'present';

                            return (
                                <motion.div
                                    key={student.id}
                                    whileTap={isTeacher ? { scale: 0.98 } : {}}
                                    onClick={() => isTeacher && toggleAttendance(student.id)}
                                    className={`card p-4 cursor-pointer transition-all ${isPresent
                                            ? 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-300 dark:border-secondary-700'
                                            : 'bg-neutral-50 dark:bg-neutral-800/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isPresent
                                                ? 'bg-secondary-500 border-secondary-500'
                                                : 'border-neutral-300 dark:border-neutral-600'
                                            }`}>
                                            {isPresent && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="font-medium text-text-primary">{student.name}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {isTeacher && (
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                            <span className="text-text-secondary">
                                Present: <span className="font-bold text-secondary-600">{Object.values(todayAttendance).filter(s => s === 'present').length}</span> / {students.length}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Seating Chart View */}
            {view === 'seating' && isTeacher && (
                <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <p className="text-center text-text-secondary">
                        Seating chart feature - drag and drop interface coming soon
                    </p>
                </div>
            )}

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={onAddStudent}
            />

            {/* Behavioral Notes Modal */}
            {selectedStudent && (
                <BehavioralNotesModal
                    isOpen={showBehaviorModal}
                    onClose={() => {
                        setShowBehaviorModal(false);
                        setSelectedStudent(null);
                    }}
                    student={selectedStudent}
                    notes={classData?.behavioralNotes?.[selectedStudent.id] || []}
                    onAddNote={(note) => onAddBehavioralNote(selectedStudent.id, note)}
                />
            )}
        </div>
    );
}

// Add Student Modal Component
function AddStudentModal({ isOpen, onClose, onAdd }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && name) {
            onAdd({ email, name });
            setEmail('');
            setName('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-modal-backdrop" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                >
                    <h3 className="text-xl font-bold text-text-primary mb-4">Add Student</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Student Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Student Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="student@school.edu"
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="btn btn-outline flex-1">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary flex-1">
                                Add Student
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </>
    );
}

// Behavioral Notes Modal
function BehavioralNotesModal({ isOpen, onClose, student, notes, onAddNote }) {
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState('neutral'); // positive, neutral, concern

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newNote.trim()) {
            onAddNote({
                content: newNote,
                type: noteType,
                timestamp: new Date().toISOString(),
            });
            setNewNote('');
            setNoteType('neutral');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-modal-backdrop" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
                >
                    <h3 className="text-xl font-bold text-text-primary mb-2">Behavioral Notes</h3>
                    <p className="text-text-secondary mb-6">{student.name}</p>

                    {/* Add Note Form */}
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                        <div className="flex gap-2">
                            {['positive', 'neutral', 'concern'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNoteType(type)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${noteType === type
                                            ? type === 'positive' ? 'bg-secondary-500 text-white' :
                                                type === 'concern' ? 'bg-orange-500 text-white' :
                                                    'bg-primary-500 text-white'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-text-secondary'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a behavioral note..."
                            className="input min-h-[80px]"
                            rows={3}
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                            Add Note
                        </button>
                    </form>

                    {/* Notes List */}
                    <div className="space-y-3">
                        {notes.length === 0 ? (
                            <p className="text-center text-text-tertiary py-8">No notes yet</p>
                        ) : (
                            notes.map((note, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border ${note.type === 'positive' ? 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-800' :
                                        note.type === 'concern' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                            'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                                    }`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={`text-xs font-semibold uppercase ${note.type === 'positive' ? 'text-secondary-600' :
                                                note.type === 'concern' ? 'text-orange-600' :
                                                    'text-neutral-600'
                                            }`}>
                                            {note.type}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {format(new Date(note.timestamp), 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <p className="text-text-primary text-sm">{note.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary mt-6">
                        <button onClick={onClose} className="btn btn-outline">
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
