// lib/firestore/assignments.js
// Assignment management for Firestore

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
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new assignment
 */
export async function createAssignment({
    classId,
    teacherId,
    title,
    description,
    dueDate,
    points,
    rubric = null,
    attachments = [],
    settings = {}
}) {
    if (!db) throw new Error('Firestore not initialized');

    const assignmentData = {
        classId,
        teacherId,
        title,
        description,
        dueDate,
        points,
        rubric,
        attachments,
        settings: {
            allowLateSubmissions: settings.allowLateSubmissions ?? true,
            allowPeerReview: settings.allowPeerReview ?? false,
            plagiarismCheck: settings.plagiarismCheck ?? true,
            ...settings,
        },
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
        versions: [],
    };

    const assignmentRef = doc(collection(db, 'assignments'));
    await setDoc(assignmentRef, assignmentData);

    return { id: assignmentRef.id, ...assignmentData };
}

/**
 * Get all assignments for a class
 */
export async function getClassAssignments(classId) {
    if (!db) return [];

    const q = query(
        collection(db, 'assignments'),
        where('classId', '==', classId),
        orderBy('dueDate', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single assignment
 */
export async function getAssignment(assignmentId) {
    if (!db) return null;

    const assignmentRef = doc(db, 'assignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) return null;

    return { id: assignmentSnap.id, ...assignmentSnap.data() };
}

/**
 * Update assignment
 */
export async function updateAssignment(assignmentId, updates) {
    if (!db) throw new Error('Firestore not initialized');

    const assignmentRef = doc(db, 'assignments', assignmentId);

    // Save version history
    const currentSnap = await getDoc(assignmentRef);
    if (currentSnap.exists()) {
        const currentData = currentSnap.data();
        const version = {
            timestamp: new Date().toISOString(),
            data: currentData,
        };

        await updateDoc(assignmentRef, {
            ...updates,
            versions: [...(currentData.versions || []), version],
            updatedAt: serverTimestamp(),
        });
    } else {
        await updateDoc(assignmentRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    }
}

/**
 * Publish assignment
 */
export async function publishAssignment(assignmentId) {
    if (!db) throw new Error('Firestore not initialized');

    const assignmentRef = doc(db, 'assignments', assignmentId);
    await updateDoc(assignmentRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete assignment
 */
export async function deleteAssignment(assignmentId) {
    if (!db) throw new Error('Firestore not initialized');

    const assignmentRef = doc(db, 'assignments', assignmentId);
    await deleteDoc(assignmentRef);
}

/**
 * Generate rubric using AI (placeholder for API call)
 */
export async function generateRubric(assignmentTitle, assignmentDescription, points) {
    // This will call the AI API to generate a rubric
    // For now, return a template
    return {
        criteria: [
            {
                name: 'Content & Understanding',
                description: 'Demonstrates understanding of the topic',
                levels: [
                    { name: 'Excellent', points: points * 0.4, description: 'Exceptional understanding' },
                    { name: 'Good', points: points * 0.3, description: 'Good understanding' },
                    { name: 'Satisfactory', points: points * 0.2, description: 'Basic understanding' },
                    { name: 'Needs Improvement', points: points * 0.1, description: 'Limited understanding' },
                ]
            },
            {
                name: 'Quality & Effort',
                description: 'Overall quality and effort demonstrated',
                levels: [
                    { name: 'Excellent', points: points * 0.3, description: 'Outstanding effort' },
                    { name: 'Good', points: points * 0.2, description: 'Good effort' },
                    { name: 'Satisfactory', points: points * 0.15, description: 'Adequate effort' },
                    { name: 'Needs Improvement', points: points * 0.05, description: 'Minimal effort' },
                ]
            },
        ]
    };
}

/**
 * Clone assignment for reuse
 */
export async function cloneAssignment(assignmentId, newClassId) {
    if (!db) throw new Error('Firestore not initialized');

    const originalRef = doc(db, 'assignments', assignmentId);
    const originalSnap = await getDoc(originalRef);

    if (!originalSnap.exists()) throw new Error('Assignment not found');

    const originalData = originalSnap.data();
    const newAssignmentData = {
        ...originalData,
        classId: newClassId,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
        versions: [],
    };

    const newAssignmentRef = doc(collection(db, 'assignments'));
    await setDoc(newAssignmentRef, newAssignmentData);

    return { id: newAssignmentRef.id, ...newAssignmentData };
}

/**
 * Get assignments by teacher
 */
export async function getTeacherAssignments(teacherId) {
    if (!db) return [];

    const q = query(
        collection(db, 'assignments'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get assignments for any user based on their role
 * @param {string} userId - The user's ID
 * @param {string} role - 'student', 'educator', or 'parent'
 * @param {Array<string>} classIds - Optional array of class IDs (for students/parents)
 */
export async function getUserAssignments(userId, role, classIds = []) {
    if (!db) return [];

    try {
        if (role === 'educator') {
            // Educators see all their created assignments
            return await getTeacherAssignments(userId);
        } else if (role === 'student' || role === 'parent') {
            // Students and parents see assignments from their classes
            if (!classIds || classIds.length === 0) return [];

            const assignmentsPromises = classIds.map(classId => getClassAssignments(classId));
            const assignmentsArrays = await Promise.all(assignmentsPromises);

            // Flatten and deduplicate
            const assignmentsMap = new Map();
            assignmentsArrays.flat().forEach(assignment => {
                if (!assignmentsMap.has(assignment.id)) {
                    assignmentsMap.set(assignment.id, assignment);
                }
            });

            return Array.from(assignmentsMap.values())
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        }

        return [];
    } catch (error) {
        console.error('Error in getUserAssignments:', error);
        return [];
    }
}
