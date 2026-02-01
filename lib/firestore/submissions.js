// lib/firestore/submissions.js
// Student submission management

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create or update a submission draft
 */
export async function saveSubmissionDraft({
    assignmentId,
    studentId,
    content,
    attachments = []
}) {
    if (!db) throw new Error('Firestore not initialized');

    const submissionId = `${assignmentId}_${studentId}`;
    const submissionRef = doc(db, 'submissions', submissionId);

    // Check if submission exists
    const submissionSnap = await getDoc(submissionRef);

    if (submissionSnap.exists()) {
        // Update existing draft
        const currentData = submissionSnap.data();
        await updateDoc(submissionRef, {
            content,
            attachments,
            versions: [
                ...(currentData.versions || []),
                {
                    timestamp: new Date().toISOString(),
                    content: currentData.content,
                    attachments: currentData.attachments,
                }
            ],
            updatedAt: serverTimestamp(),
        });
    } else {
        // Create new draft
        await setDoc(submissionRef, {
            assignmentId,
            studentId,
            content,
            attachments,
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            submittedAt: null,
            gradedAt: null,
            grade: null,
            feedback: '',
            plagiarismScore: null,
            peerReviews: [],
            versions: [],
        });
    }

    return { id: submissionId };
}

/**
 * Submit assignment
 */
export async function submitAssignment(assignmentId, studentId) {
    if (!db) throw new Error('Firestore not initialized');

    const submissionId = `${assignmentId}_${studentId}`;
    const submissionRef = doc(db, 'submissions', submissionId);

    await updateDoc(submissionRef, {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get submission for a student
 */
export async function getSubmission(assignmentId, studentId) {
    if (!db) return null;

    const submissionId = `${assignmentId}_${studentId}`;
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) return null;

    return { id: submissionSnap.id, ...submissionSnap.data() };
}

/**
 * Get all submissions for an assignment
 */
export async function getAssignmentSubmissions(assignmentId) {
    if (!db) return [];

    const q = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Grade a submission
 */
export async function gradeSubmission({
    assignmentId,
    studentId,
    grade,
    feedback,
    rubricScores = null
}) {
    if (!db) throw new Error('Firestore not initialized');

    const submissionId = `${assignmentId}_${studentId}`;
    const submissionRef = doc(db, 'submissions', submissionId);

    await updateDoc(submissionRef, {
        grade,
        feedback,
        rubricScores,
        status: 'graded',
        gradedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Bulk grade submissions with comment bank
 */
export async function bulkGradeSubmissions(grades) {
    if (!db) throw new Error('Firestore not initialized');

    const promises = grades.map(({ assignmentId, studentId, grade, feedback, rubricScores }) =>
        gradeSubmission({ assignmentId, studentId, grade, feedback, rubricScores })
    );

    await Promise.all(promises);
}

/**
 * Request extension
 */
export async function requestExtension({
    assignmentId,
    studentId,
    reason,
    requestedDate
}) {
    if (!db) throw new Error('Firestore not initialized');

    const extensionData = {
        assignmentId,
        studentId,
        reason,
        requestedDate,
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
    };

    const extensionRef = doc(collection(db, 'extensionRequests'));
    await setDoc(extensionRef, extensionData);

    return { id: extensionRef.id, ...extensionData };
}

/**
 * Review extension request
 */
export async function reviewExtensionRequest(requestId, approved, teacherId, newDueDate = null) {
    if (!db) throw new Error('Firestore not initialized');

    const requestRef = doc(db, 'extensionRequests', requestId);
    await updateDoc(requestRef, {
        status: approved ? 'approved' : 'denied',
        reviewedAt: serverTimestamp(),
        reviewedBy: teacherId,
        newDueDate: approved ? newDueDate : null,
    });

    // If approved, update the assignment due date for this student
    if (approved && newDueDate) {
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.data();

        const submissionId = `${requestData.assignmentId}_${requestData.studentId}`;
        const submissionRef = doc(db, 'submissions', submissionId);

        await updateDoc(submissionRef, {
            customDueDate: newDueDate,
            updatedAt: serverTimestamp(),
        });
    }
}

/**
 * Add peer review
 */
export async function addPeerReview({
    assignmentId,
    studentId,
    reviewerId,
    feedback,
    rubricScores = null
}) {
    if (!db) throw new Error('Firestore not initialized');

    const submissionId = `${assignmentId}_${studentId}`;
    const submissionRef = doc(db, 'submissions', submissionId);

    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) throw new Error('Submission not found');

    const currentData = submissionSnap.data();
    const peerReview = {
        reviewerId,
        feedback,
        rubricScores,
        timestamp: new Date().toISOString(),
    };

    await updateDoc(submissionRef, {
        peerReviews: [...(currentData.peerReviews || []), peerReview],
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get student's all submissions
 */
export async function getStudentSubmissions(studentId) {
    if (!db) return [];

    const q = query(
        collection(db, 'submissions'),
        where('studentId', '==', studentId),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Check plagiarism (placeholder)
 */
export async function checkPlagiarism(content) {
    // This would integrate with a plagiarism detection API
    // For now, return a mock score
    const score = Math.random() * 30; // 0-30% similarity
    return {
        score,
        sources: [],
        flagged: score > 20,
    };
}
