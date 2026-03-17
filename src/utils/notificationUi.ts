import { AlertCircle, MessageSquare, MessageCircle, CheckCircle2, Bell, Info } from 'lucide-react';
import type { NotificationEventType, Notification } from '../services/dataService';

export function getNotificationIcon(type: NotificationEventType | string | undefined, role?: 'teacher' | 'student' | 'parent' | string) {
    switch (type) {
        case 'message':
            return role === 'parent' ? MessageSquare : MessageCircle;
        case 'alert':
        case 'needs_attention':
            return AlertCircle;
        case 'submission':
            return CheckCircle2;
        case 'general':
            return Bell;
        default:
            return Info;
    }
}

export function getNotificationColorClasses(type: NotificationEventType | string | undefined, role?: 'teacher' | 'student' | 'parent' | string): { bg: string; text: string } {
    switch (type) {
        case 'message':
            return {
                bg: role === 'parent' ? 'bg-blue-100' : 'bg-pink-100',
                text: role === 'parent' ? 'text-blue-600' : 'text-pink-600'
            };
        case 'alert':
        case 'needs_attention':
            return {
                bg: role === 'teacher' ? 'bg-purple-100' : role === 'student' ? 'bg-[#68507B]/10' : 'bg-orange-100',
                text: role === 'teacher' ? 'text-purple-600' : role === 'student' ? 'text-[#68507B]' : 'text-orange-600'
            };
        case 'submission':
            return {
                bg: 'bg-green-100',
                text: 'text-green-600'
            };
        case 'general':
        default:
            return {
                bg: 'bg-slate-100',
                text: 'text-slate-600'
            };
    }
}

export function getNotificationDefaultDestination(notification: Notification | { type: string, role?: string }): string {
    const { role, type } = notification;

    if (role === 'teacher') {
        switch (type) {
            case 'submission': return 'grading';
            case 'needs_attention': return 'reports';
            case 'message': return 'messages';
            default: return 'dashboard'; // Default mapped for general
        }
    } else if (role === 'parent') {
        switch (type) {
            case 'alert': return 'assignments';
            case 'message': return 'messages';
            default: return 'progress';
        }
    } else {
        // student
        return 'dashboard';
    }
}
