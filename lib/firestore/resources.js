// lib/firestore/resources.js
// Resource library and lesson plan management

import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Add resource to library
 */
export async function addResource({
    teacherId,
    classId = null,
    title,
    description,
    type,
    url,
    curriculum = [],
    tags = []
}) {
    if (!db) throw new Error('Firestore not initialized');

    const resourceData = {
        teacherId,
        classId,
        title,
        description,
        type,
        url,
        curriculum,
        tags,
        createdAt: serverTimestamp(),
        usageCount: 0,
    };

    const resourceRef = doc(collection(db, 'resources'));
    await setDoc(resourceRef, resourceData);

    return { id: resourceRef.id, ...resourceData };
}

/**
 * Get teacher's resources
 */
export async function getTeacherResources(teacherId) {
    if (!db) return [];

    const q = query(
        collection(db, 'resources'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get class resources
 */
export async function getClassResources(classId) {
    if (!db) return [];

    const q = query(
        collection(db, 'resources'),
        where('classId', '==', classId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Delete resource
 */
export async function deleteResource(resourceId) {
    if (!db) throw new Error('Firestore not initialized');

    const resourceRef = doc(db, 'resources', resourceId);
    await deleteDoc(resourceRef);
}

/**
 * Create lesson plan
 */
export async function createLessonPlan({
    teacherId,
    classId,
    title,
    subject,
    level,
    duration,
    objectives,
    materials,
    activities,
    assessment,
    differentiation,
    curriculumStandards = [],
    resources = []
}) {
    if (!db) throw new Error('Firestore not initialized');

    const lessonData = {
        teacherId,
        classId,
        title,
        subject,
        level,
        duration,
        objectives,
        materials,
        activities,
        assessment,
        differentiation,
        curriculumStandards,
        resources,
        createdAt: serverTimestamp(),
        usedCount: 0,
    };

    const lessonRef = doc(collection(db, 'lessonPlans'));
    await setDoc(lessonRef, lessonData);

    return { id: lessonRef.id, ...lessonData };
}

/**
 * Get teacher's lesson plans
 */
export async function getTeacherLessonPlans(teacherId) {
    if (!db) return [];

    const q = query(
        collection(db, 'lessonPlans'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Generate substitute teacher packet
 */
export async function generateSubstitutePacket(classId, date) {
    if (!db) return null;

    // Get class info
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) return null;

    const classData = classSnap.data();

    // Get lesson plans for the class
    const lessonPlansQuery = query(
        collection(db, 'lessonPlans'),
        where('classId', '==', classId),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
    const lessonPlansSnapshot = await getDocs(lessonPlansQuery);
    const latestLesson = lessonPlansSnapshot.docs[0]?.data();

    // Get class resources
    const resources = await getClassResources(classId);

    // Get seating chart
    const seatingChart = classData.seatingChart;

    // Get behavioral notes
    const behavioralNotes = classData.behavioralNotes || {};

    const packet = {
        date,
        classInfo: {
            name: classData.name,
            subject: classData.subject,
            level: classData.level,
            studentCount: classData.students?.length || 0,
        },
        schedule: latestLesson?.activities || [],
        lessonPlan: latestLesson || null,
        seatingChart,
        studentNotes: Object.entries(behavioralNotes).map(([studentId, notes]) => ({
            studentId,
            notes: notes.slice(-3), // Last 3 notes
        })),
        resources: resources.slice(0, 10), // Top 10 resources
        emergencyContacts: {
            principalOffice: 'Main Office',
            teacherEmail: classData.teacherId,
        },
        classRules: classData.settings?.classRules || [],
    };

    return packet;
}

/**
 * Curriculum standards database (sample)
 */
export const CURRICULUM_STANDARDS = {
    'US_Common_Core_Math': [
        { id: 'CCSS.MATH.CONTENT.K.CC.A.1', grade: 'K', subject: 'Math', description: 'Count to 100 by ones and by tens' },
        { id: 'CCSS.MATH.CONTENT.1.OA.A.1', grade: '1', subject: 'Math', description: 'Use addition and subtraction within 20' },
        { id: 'CCSS.MATH.CONTENT.2.NBT.A.1', grade: '2', subject: 'Math', description: 'Understand place value' },
        { id: 'CCSS.MATH.CONTENT.3.NF.A.1', grade: '3', subject: 'Math', description: 'Understand fractions as numbers' },
        { id: 'CCSS.MATH.CONTENT.4.NF.B.3', grade: '4', subject: 'Math', description: 'Understand decimal notation' },
        { id: 'CCSS.MATH.CONTENT.5.NBT.B.7', grade: '5', subject: 'Math', description: 'Add, subtract, multiply, and divide decimals' },
    ],
    'Singapore_Primary_Math': [
        { id: 'SG.P1.MATH.NUM.1', grade: 'P1', subject: 'Math', description: 'Numbers up to 100' },
        { id: 'SG.P2.MATH.NUM.1', grade: 'P2', subject: 'Math', description: 'Numbers up to 1000' },
        { id: 'SG.P3.MATH.FRAC.1', grade: 'P3', subject: 'Math', description: 'Fractions (halves, quarters)' },
        { id: 'SG.P4.MATH.DEC.1', grade: 'P4', subject: 'Math', description: 'Decimals (tenths, hundredths)' },
        { id: 'SG.P5.MATH.PERC.1', grade: 'P5', subject: 'Math', description: 'Percentage' },
        { id: 'SG.P6.MATH.RAT.1', grade: 'P6', subject: 'Math', description: 'Ratio' },
    ],
};

/**
 * Find matching curriculum standards
 */
export function findCurriculumStandards(country, level, subject, keywords = []) {
    const standardsKey = `${country}_${subject}`;
    const standards = CURRICULUM_STANDARDS[standardsKey] || [];

    if (keywords.length === 0) {
        return standards.filter(s => s.grade === level);
    }

    return standards.filter(s => {
        const matchesGrade = s.grade === level;
        const matchesKeywords = keywords.some(keyword =>
            s.description.toLowerCase().includes(keyword.toLowerCase())
        );
        return matchesGrade && matchesKeywords;
    });
}
