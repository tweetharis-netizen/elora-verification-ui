import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { getNotificationIcon, getNotificationColorClasses } from '../utils/notificationUi';

export interface PopoverNotificationItem {
    id: string;
    title?: string;
    message: string;
    time: string;
    isRead?: boolean;
    type?: 'alert' | 'message' | 'general' | 'needs_attention' | 'submission';
    action?: () => void;
    original?: any;
}

interface NotificationsPopoverProps {
    items: PopoverNotificationItem[];
    unreadCount: number;
    onMarkAllRead?: () => void;
    onNotificationClick?: (item: PopoverNotificationItem) => void;
    badgeColor?: string;
    headerTextColor?: string;
    emptyMessage?: string;
    unreadDotColor?: string;
    unreadBgColor?: string;
}

export function NotificationsPopover({
    items,
    unreadCount,
    onMarkAllRead,
    onNotificationClick,
    badgeColor = 'bg-orange-500',
    headerTextColor = 'text-teal-600',
    emptyMessage = "You're all caught up!",
    unreadDotColor = 'bg-blue-500',
    unreadBgColor = 'bg-blue-50/20'
}: NotificationsPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleItemClick = (item: PopoverNotificationItem) => {
        if (item.action) {
            item.action();
        } else if (onNotificationClick) {
            onNotificationClick(item);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-full transition-all border border-transparent hover:border-[#EAE7DD]"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={`absolute top-1 right-1 w-2.5 h-2.5 ${badgeColor} rounded-full border-2 border-[#FDFBF5]`} />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-[#EAE7DD] shadow-xl z-50 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-[#EAE7DD] bg-[#FDFBF5]">
                            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                            {unreadCount > 0 && onMarkAllRead && (
                                <button
                                    onClick={() => {
                                        onMarkAllRead();
                                        setIsOpen(false);
                                    }}
                                    className={`text-xs font-semibold ${headerTextColor} hover:opacity-80 transition-opacity`}
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto w-full">
                            {items.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p>{emptyMessage}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-[#EAE7DD]">
                                    {items.slice(0, 10).map(item => {
                                        const isUnread = !item.isRead;
                                        const IconComponent = getNotificationIcon(item.type, item.original?.role);
                                        const colors = getNotificationColorClasses(item.type, item.original?.role);

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={`w-full text-left flex items-start gap-3 p-4 hover:bg-slate-50 transition-all duration-300 ease-in-out ${isUnread ? unreadBgColor : 'bg-white'}`}
                                            >
                                                {/* Icon Bubble */}
                                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${colors.bg} ${colors.text} ${isUnread ? 'scale-100' : 'scale-95 opacity-80'}`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                
                                                {/* Content Area */}
                                                <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isUnread ? 'opacity-100' : 'opacity-85'}`}>
                                                    <h4 className="text-[13px] font-semibold text-slate-900 line-clamp-1 leading-tight">
                                                        {item.title || (item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Notification')}
                                                    </h4>
                                                    <p className="text-[12px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                                                        {item.message}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                                                        {item.time}
                                                    </p>
                                                </div>

                                                {/* Unread dot */}
                                                <div className={`mt-1.5 shrink-0 ml-1 transition-all duration-300 ${isUnread ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                                    <div className={`w-2 h-2 ${unreadDotColor} rounded-full shadow-sm`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {items.length > 10 && (
                                        <div className="p-4 text-center text-xs font-semibold text-slate-500 bg-white border-t border-[#EAE7DD]">
                                            View older activity...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
