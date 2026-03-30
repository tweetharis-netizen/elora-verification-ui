import React from 'react';
import { Users, ChevronRight } from 'lucide-react';

export interface ClassSummaryCardProps {
    key?: React.Key;
    role: 'student' | 'teacher' | 'parent';
    name: string;
    subject?: string;
    themeColor?: string;
    playfulBackground?: boolean;
    metaPrimaryNode?: React.ReactNode;
    metaSecondaryNode?: React.ReactNode;
    progress?: number;
    onEnter: () => void;
}

export function ClassSummaryCard({
    role,
    name,
    subject,
    themeColor,
    playfulBackground = true,
    metaPrimaryNode,
    metaSecondaryNode,
    progress,
    onEnter
}: ClassSummaryCardProps) {

    const roleStyles = (() => {
        switch (role) {
            case 'teacher':
                return {
                    borderHover: 'hover:border-teal-600/30',
                    textHover: 'group-hover:text-teal-700',
                    text: 'text-teal-700',
                    bgFallback: 'from-teal-600 to-teal-800',
                };
            case 'parent':
                return {
                    borderHover: 'hover:border-orange-600/30',
                    textHover: 'group-hover:text-orange-700',
                    text: 'text-orange-700',
                    bgFallback: 'from-orange-500 to-orange-700',
                };
            case 'student':
            default:
                return {
                    borderHover: 'hover:border-[#68507B]/30',
                    textHover: 'group-hover:text-[#68507B]',
                    text: 'text-[#68507B]',
                    bgFallback: 'from-[#68507B] to-[#7B6194]',
                };
        }
    })();

    const backgroundGradient = themeColor === 'blue' || themeColor === 'indigo' ? 'from-indigo-500 to-blue-600' :
        themeColor === 'purple' ? 'from-[#68507B] to-[#7B6194]' :
        themeColor === 'green' || themeColor === 'emerald' ? 'from-emerald-500 to-teal-600' :
        themeColor === 'teal' ? 'from-teal-500 to-cyan-600' :
        themeColor === 'orange' || themeColor === 'amber' ? 'from-orange-500 to-amber-600' :
        themeColor === 'slate' ? 'from-slate-500 to-slate-700' :
        roleStyles.bgFallback;

    return (
        <div 
            onClick={onEnter}
            className={`group relative bg-white rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md ${roleStyles.borderHover} hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col`}
        >
            {/* Header/Banner Area */}
            <div className={`h-24 w-full relative overflow-hidden bg-gradient-to-br transition-all duration-500 ${backgroundGradient}`}>
                {/* Playful background pattern if enabled */}
                {playfulBackground !== false && (
                    <div className="absolute inset-0 opacity-[0.14] pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <pattern id={`pattern-${name.replace(/\s+/g, '-')}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.8" />
                                <rect x="10" y="10" width="1.5" height="1.5" rx="0.5" fill="white" fillOpacity="0.3" />
                            </pattern>
                            <rect width="100" height="100" fill={`url(#pattern-${name.replace(/\s+/g, '-')})`} />
                        </svg>
                    </div>
                )}
                <div className="absolute top-4 right-4">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white">
                        <Users size={18} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex flex-col gap-1 mb-4">
                    <div className="flex items-center gap-2">
                        {subject && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                                {subject}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-[18px] font-bold text-slate-900 leading-tight ${roleStyles.textHover} transition-colors line-clamp-1`}>{name}</h3>
                        {progress !== undefined && (
                            <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Curriculum</span>
                                <span className={`text-[11px] font-black ${roleStyles.text}`}>{progress}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {progress !== undefined && (
                    <div className="mb-5 space-y-1.5">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-gradient-to-r ${backgroundGradient} transition-all duration-1000 ease-out`} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                )}

                {metaPrimaryNode && (
                    <div className="mb-5">
                        {metaPrimaryNode}
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between group-hover:bg-[#FDFBF5]/50 -mx-5 -mb-5 px-5 pb-5 transition-colors">
                    <span className={`text-[13px] font-semibold ${roleStyles.text} flex items-center gap-1`}>
                        Enter Classroom <ChevronRight size={14} />
                    </span>
                    {metaSecondaryNode && (
                        <div className="text-[12px] font-medium text-slate-400">
                            {metaSecondaryNode}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
