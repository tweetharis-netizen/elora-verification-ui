import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { ClassroomHeader } from './ClassroomComponents';
import { resolveClassThemeSettings, type ClassBannerStyle, type ClassThemeColorKey } from '../../lib/classTheme';

interface ClassSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: { themeColor: string; bannerStyle: string; playfulBackground: boolean }) => void;
    currentClass: any;
    classroomTitle?: string;
}

const THEME_COLORS: Array<{ id: ClassThemeColorKey; hex: string; label: string; ringClass: string }> = [
    { id: 'slate', hex: '#1E293B', label: 'Default', ringClass: 'focus:ring-slate-500' },
    { id: 'teal', hex: '#0F766E', label: 'Teal', ringClass: 'focus:ring-teal-500' },
    { id: 'indigo', hex: '#4338CA', label: 'Indigo', ringClass: 'focus:ring-indigo-500' },
    { id: 'amber', hex: '#B45309', label: 'Amber', ringClass: 'focus:ring-amber-500' },
    { id: 'emerald', hex: '#047857', label: 'Emerald', ringClass: 'focus:ring-emerald-500' },
];

const BANNER_STYLES: Array<{ id: ClassBannerStyle; label: string }> = [
    { id: 'default', label: 'Default' },
    { id: 'math', label: 'Mathematics' },
    { id: 'science', label: 'Science' },
    { id: 'language', label: 'Language' },
    { id: 'arts', label: 'Arts' },
];

export function ClassSettingsModal({ isOpen, onClose, onSave, currentClass, classroomTitle }: ClassSettingsModalProps) {
    const initialSettings = resolveClassThemeSettings({
        subject: currentClass?.subject,
        themeColor: currentClass?.themeColor,
        bannerStyle: currentClass?.bannerStyle,
    });
    const [themeColor, setThemeColor] = useState<ClassThemeColorKey>(initialSettings.themeColor);
    const [bannerStyle, setBannerStyle] = useState<ClassBannerStyle>(initialSettings.bannerStyle);
    const [playfulBackground, setPlayfulBackground] = useState(currentClass?.playfulBackground ?? false);
    
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset state when currentClass overrides change
    useEffect(() => {
        if (isOpen) {
            const resolvedSettings = resolveClassThemeSettings({
                subject: currentClass?.subject,
                themeColor: currentClass?.themeColor,
                bannerStyle: currentClass?.bannerStyle,
            });
            setThemeColor(resolvedSettings.themeColor);
            setBannerStyle(resolvedSettings.bannerStyle);
            setPlayfulBackground(currentClass?.playfulBackground ?? false);
        }
    }, [isOpen, currentClass]);

    // Handle focus trap and escape key
    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            
            // Basic focus trap could go here if needed
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const mockClassForPreview = {
        ...currentClass,
        themeColor,
        bannerStyle,
        playfulBackground
    };

    return (
        <div ref={overlayRef} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 p-safe">
            <div 
                ref={modalRef} 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="class-settings-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 id="class-settings-title" className="text-xl font-bold tracking-tight text-slate-800">
                        Class Settings
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close settings"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
                    
                    {/* Left: Live Preview */}
                    <div className="flex-1 min-w-[300px]">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Live Preview</h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <ClassroomHeader 
                                currentClass={mockClassForPreview}
                                classroomTitle={classroomTitle || 'Class Preview'}
                                role="student" /* Hides settings button in preview */
                            />
                        </div>
                    </div>
                    
                    {/* Right: Controls */}
                    <div className="flex-1 min-w-[280px] flex flex-col gap-8">
                        
                        {/* Theme Color */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Theme Color</h3>
                            <div className="flex flex-wrap gap-3">
                                {THEME_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setThemeColor(color.id)}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${color.ringClass} ${themeColor === color.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                        style={{ backgroundColor: color.hex }}
                                        aria-label={`Select ${color.label} theme`}
                                        title={color.label}
                                    >
                                        {themeColor === color.id && <Check className="text-white drop-shadow-sm" size={20} />}
                                    </button>
                                ))}
                            </div>
                        </section>
                        
                        {/* Banner Illustration */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Banner Style</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {BANNER_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setBannerStyle(style.id)}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${bannerStyle === style.id ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                        
                        {/* Playful Background Toggle */}
                        <section>
                            <label className="flex items-center justify-between cursor-pointer group p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">Playful Background</div>
                                    <div className="text-xs text-slate-500 mt-1">Add colorful shapes and accents to the banner.</div>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${playfulBackground ? 'bg-teal-600' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${playfulBackground ? 'translate-x-6' : 'translate-x-1'}`} />
                                    <input 
                                        type="checkbox"
                                        className="sr-only"
                                        checked={playfulBackground}
                                        onChange={(e) => setPlayfulBackground(e.target.checked)}
                                    />
                                </div>
                            </label>
                        </section>
                        
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave({ themeColor, bannerStyle, playfulBackground })}
                        className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 shadow-sm transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                        Save Changes
                    </button>
                </div>
                
            </div>
        </div>
    );
}