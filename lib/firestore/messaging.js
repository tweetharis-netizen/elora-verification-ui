// lib/firestore/messaging.js
// Parent-teacher communication and messaging

import {
    collection,
    doc,
    setDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Send message
 */
export async function sendMessage({
    fromId,
    fromName,
    toId,
    toName,
    classId = null,
    subject,
    content,
    templateUsed = null
}) {
    if (!db) throw new Error('Firestore not initialized');

    const messageData = {
        fromId,
        fromName,
        toId,
        toName,
        classId,
        subject,
        content,
        templateUsed,
        read: false,
        replied: false,
        createdAt: serverTimestamp(),
        readAt: null,
    };

    const messageRef = doc(collection(db, 'messages'));
    await setDoc(messageRef, messageData);

    return { id: messageRef.id, ...messageData };
}

/**
 * Get inbox messages
 */
export async function getInboxMessages(userId) {
    if (!db) return [];

    const q = query(
        collection(db, 'messages'),
        where('toId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get sent messages
 */
export async function getSentMessages(userId) {
    if (!db) return [];

    const q = query(
        collection(db, 'messages'),
        where('fromId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId) {
    if (!db) throw new Error('Firestore not initialized');

    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        read: true,
        readAt: serverTimestamp(),
    });
}

/**
 * Post class announcement
 */
export async function postAnnouncement({
    classId,
    teacherId,
    teacherName,
    title,
    content,
    priority = 'normal',
    attachments = []
}) {
    if (!db) throw new Error('Firestore not initialized');

    const announcementData = {
        classId,
        teacherId,
        teacherName,
        title,
        content,
        priority,
        attachments,
        createdAt: serverTimestamp(),
        readBy: [],
    };

    const announcementRef = doc(collection(db, 'announcements'));
    await setDoc(announcementRef, announcementData);

    return { id: announcementRef.id, ...announcementData };
}

/**
 * Get class announcements
 */
export async function getClassAnnouncements(classId) {
    if (!db) return [];

    const q = query(
        collection(db, 'announcements'),
        where('classId', '==', classId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Mark announcement as read
 */
export async function markAnnouncementAsRead(announcementId, userId) {
    if (!db) throw new Error('Firestore not initialized');

    const announcementRef = doc(db, 'announcements', announcementId);
    const announcementSnap = await getDocs(announcementRef);

    if (announcementSnap.exists()) {
        const data = announcementSnap.data();
        const readBy = data.readBy || [];

        if (!readBy.includes(userId)) {
            await updateDoc(announcementRef, {
                readBy: [...readBy, userId],
            });
        }
    }
}

/**
 * Get message templates for teachers
 */
export const MESSAGE_TEMPLATES = [
    {
        id: 'progress_update',
        name: 'Progress Update',
        subject: 'Update on [Student Name]\'s Progress',
        content: 'Dear [Parent Name],\n\nI wanted to share an update on [Student Name]\'s progress in [Subject].\n\n[Details about progress]\n\nIf you have any questions or would like to discuss further, please don\'t hesitate to reach out.\n\nBest regards,\n[Teacher Name]',
    },
    {
        id: 'meeting_request',
        name: 'Meeting Request',
        subject: 'Request for Parent-Teacher Conference',
        content: 'Dear [Parent Name],\n\nI would like to schedule a brief meeting to discuss [Student Name]\'s performance and progress.\n\nPlease let me know your availability for a 15-20 minute conversation.\n\nBest regards,\n[Teacher Name]',
    },
    {
        id: 'missing_work',
        name: 'Missing Work Alert',
        subject: 'Missing Assignment(s) - [Student Name]',
        content: 'Dear [Parent Name],\n\nI wanted to inform you that [Student Name] has missing assignment(s) in [Subject]:\n\n[List of assignments]\n\nPlease help remind [Student Name] to complete these assignments.\n\nThank you,\n[Teacher Name]',
    },
    {
        id: 'positive_feedback',
        name: 'Positive Feedback',
        subject: 'Great Work from [Student Name]!',
        content: 'Dear [Parent Name],\n\nI wanted to share some positive feedback about [Student Name]!\n\n[Specific achievement or behavior]\n\nKeep up the excellent work!\n\nBest regards,\n[Teacher Name]',
    },
    {
        id: 'field_trip',
        name: 'Field Trip Permission',
        subject: 'Field Trip Permission - [Date]',
        content: 'Dear [Parent Name],\n\nOur class will be going on a field trip to [Location] on [Date].\n\nDetails:\n- Departure: [Time]\n- Return: [Time]\n- Cost: [Amount]\n- What to bring: [Items]\n\nPlease sign and return the permission slip by [Deadline].\n\nThank you,\n[Teacher Name]',
    },
];

/**
 * Apply template
 */
export function applyTemplate(templateId, replacements = {}) {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    let subject = template.subject;
    let content = template.content;

    Object.entries(replacements).forEach(([key, value]) => {
        const placeholder = `[${key}]`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, content };
}
