// lib/firestore/classes.js
// Class management CRUD operations for Firestore

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generate a random class join code
 */
export function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create a new class
 */
export async function createClass({ teacherId, name, subject, level, description = '' }) {
    if (!db) throw new Error('Firestore not initialized');

    const joinCode = generateJoinCode();
    const classData = {
        teacherId,
        name,
        subject,
        level,
        description,
        joinCode,
        students: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        seatingChart: null,
        attendance: {},
        behavioralNotes: {},
        settings: {
            allowChat: true,
            moderateChat: true,
            allowPeerReview: true,
            allowExtensionRequests: true,
        }
    };

    const classRef = doc(collection(db, 'classes'));
    await setDoc(classRef, classData);

    return { id: classRef.id, ...classData };
}

/**
 * Get all classes for a teacher
 */
export async function getTeacherClasses(teacherId) {
    if (!db) return [];

    const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single class by ID
 */
export async function getClass(classId) {
    if (!db) return null;

    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) return null;

    return { id: classSnap.id, ...classSnap.data() };
}

/**
 * Find class by join code
 */
export async function getClassByJoinCode(joinCode) {
    if (!db) return null;

    const q = query(collection(db, 'classes'), where('joinCode', '==', joinCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

/**
 * Add student to class
 */
export async function addStudentToClass(classId, studentData) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
        students: arrayUnion({
            id: studentData.id,
            name: studentData.name,
            email: studentData.email,
            joinedAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Remove student from class
 */
export async function removeStudentFromClass(classId, studentId) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) throw new Error('Class not found');

    const classData = classSnap.data();
    const updatedStudents = classData.students.filter(s => s.id !== studentId);

    await updateDoc(classRef, {
        students: updatedStudents,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update class settings
 */
export async function updateClass(classId, updates) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update seating chart
 */
export async function updateSeatingChart(classId, seatingChart) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
        seatingChart,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Record attendance
 */
export async function recordAttendance(classId, date, attendanceData) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
        [`attendance.${date}`]: attendanceData,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Add behavioral note
 */
export async function addBehavioralNote(classId, studentId, note) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    const noteData = {
        content: note,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
    };

    await updateDoc(classRef, {
        [`behavioralNotes.${studentId}`]: arrayUnion(noteData),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete class
 */
export async function deleteClass(classId) {
    if (!db) throw new Error('Firestore not initialized');

    const classRef = doc(db, 'classes', classId);
    await deleteDoc(classRef);
}

/**
 * Get all classes a student has joined
 */
export async function getStudentClasses(studentId) {
    if (!db) return [];

    const allClasses = await getDocs(collection(db, 'classes'));
    const studentClasses = [];

    allClasses.forEach(doc => {
        const classData = doc.data();
        const isEnrolled = classData.students?.some(s => s.id === studentId);
        if (isEnrolled) {
            studentClasses.push({ id: doc.id, ...classData });
        }
    });

    return studentClasses;
}
