import React, { useRef, useState } from 'react';
import { ArrowRight, Sparkles, Paperclip, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { CopilotFileAttachment } from '../../lib/llm/types';
import { CopilotPrivacyNote } from './CopilotShared';
export const CopilotInputBar: React.FC<{
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    isThinking: boolean;
    themeColor: string;
    placeholder?: string;
    microcopy?: string;
    files?: CopilotFileAttachment[];
    onFileAttach?: (file: File) => void;
    onFileRemove?: (fileId: string) => void;
    isUploading?: boolean;
    role?: 'teacher' | 'student' | 'parent';
    showPrivacyNote?: boolean;
    containerClassName?: string;
}> = ({ 
    value, 
    onChange, 
    onSend, 
    isThinking, 
    themeColor, 
    placeholder = 'Message Elora...', 
    microcopy,
    files = [],
    onFileAttach,
    onFileRemove,
    isUploading = false,
    role = 'student'
    , showPrivacyNote = true, containerClassName,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);


    const renderHighlights = () => {
        const regex = /(@[\w:-]+)/g;
        const parts = value.split(regex);
        return parts.map((part, i) => {
            if (part.match(regex)) {
                return (
                    <span 
                        key={i} 
                        style={{ 
                            color: themeColor, 
                            fontWeight: 'bold', 
                            backgroundColor: `${themeColor}20`, 
                            borderRadius: '4px', 
                            padding: '0 2px' 
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return <span key={i} className="text-transparent">{part}</span>;
        });
    };

    const hasMentions = /@[\w:-]+/.test(value);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 128) + 'px';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLocalError(null);

        // Local validation
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            setLocalError("That file is too large (max 10MB).");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (onFileAttach) {
            onFileAttach(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-2 pb-1">

            {localError && (
                <div className="flex flex-col gap-1.5 px-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <AlertCircle size={12} />
                        {localError}
                    </div>
                </div>
            )}

            <div className={`relative group shadow-2xl shadow-slate-200/50 dark:shadow-sm dark:shadow-black/30 rounded-2xl bg-white dark:bg-[var(--elora-surface-main)] border border-slate-200 dark:border-[var(--elora-border-subtle)] focus-within:border-slate-300 dark:focus-within:border-[#14b8a6] focus-within:ring-4 focus-within:ring-slate-500/5 dark:focus-within:ring-teal-500/10 transition-all duration-300 ${containerClassName ?? ''}`}>
                {/* File Attachments Area */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                        {files.map((file) => (
                            <div 
                                key={file.id}
                                className="group/file flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-slate-50 dark:bg-[var(--elora-surface-alt)] border border-slate-100 dark:border-[var(--elora-border-subtle)] hover:border-slate-200 dark:hover:border-[#14b8a6] transition-all shadow-sm"
                            >
                                {file.type === 'image' ? (
                                    <ImageIcon size={14} className="text-slate-400 dark:text-[var(--elora-text-muted)]" />
                                ) : (
                                    <FileText size={14} className="text-slate-400 dark:text-[var(--elora-text-muted)]" />
                                )}
                                <span className="text-[11px] font-bold text-slate-600 dark:text-[var(--elora-text-secondary)] max-w-[120px] truncate">
                                    {file.name}
                                </span>
                                <button
                                    onClick={() => onFileRemove?.(file.id)}
                                    className="p-1 rounded-md text-slate-300 dark:text-[var(--elora-text-muted)] hover:text-slate-600 dark:hover:text-[var(--elora-text-strong)] hover:bg-slate-200/50 dark:hover:bg-[var(--elora-border-subtle)] transition-all"
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative min-h-[56px] w-full flex">
                    <div 
                        className="absolute inset-0 px-5 py-4 text-[15px] font-medium whitespace-pre-wrap break-words w-full pr-24 pointer-events-none"
                        style={{ fontFamily: 'inherit', lineHeight: 'inherit' }}
                    >
                        {renderHighlights()}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onInput={handleInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if ((value.trim() || files.length > 0) && !isThinking && !isUploading) {
                                    onSend();
                                    setLocalError(null);
                                    if (textareaRef.current) textareaRef.current.style.height = '56px';
                                }
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full bg-transparent px-5 py-4 text-base font-medium outline-none pr-24 resize-none min-h-[56px] max-h-32 z-10 placeholder:text-slate-500 dark:placeholder:text-[var(--elora-text-secondary)]"
                        rows={1}
                        style={{ 
                            color: hasMentions ? 'transparent' : 'var(--elora-text-strong, #1e293b)', 
                            caretColor: 'var(--elora-text-strong, #1e293b)'
                        }}
                    />
                </div>
                
                <div className="absolute right-2 top-2 flex items-center gap-1.5 z-20">
                    <button
                        onClick={() => {
                            setLocalError(null);
                            fileInputRef.current?.click();
                        }}
                        disabled={isThinking || isUploading || files.length >= 5}
                        aria-label={files.length >= 5 ? "File attachment limit reached" : "Attach a file"}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300 active:scale-90 disabled:opacity-50"
                        title={files.length >= 5 ? "Max 5 files per message" : "Attach a file (max 5)"}
                    >
                        <Paperclip size={20} strokeWidth={2} />
                    </button>

                    <button
                        onClick={() => {
                            if ((value.trim() || files.length > 0) && !isThinking && !isUploading) {
                                onSend();
                                setLocalError(null);
                                if (textareaRef.current) textareaRef.current.style.height = '56px';
                            }
                        }}
                        disabled={(!value.trim() && files.length === 0) || isThinking || isUploading}
                        aria-label="Send message"
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm ${
                            (value.trim() || files.length > 0) && !isThinking && !isUploading
                                ? 'text-white shadow-lg active:scale-90'
                                : 'bg-slate-50 text-slate-300'
                        }`}
                        style={(value.trim() || files.length > 0) && !isThinking && !isUploading ? { backgroundColor: themeColor } : {}}
                    >
                        <ArrowRight size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />

                {hasMentions && microcopy && (
                    <div className="absolute -top-8 left-4 px-3 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-[var(--elora-text-secondary)] bg-white dark:bg-[var(--elora-surface-main)] border border-slate-200 dark:border-[var(--elora-border-subtle)] shadow-sm dark:shadow-md animate-in slide-in-from-bottom-2 fade-in flex items-center gap-1.5 z-30">
                        <Sparkles size={12} style={{ color: themeColor }} />
                        {microcopy}
                    </div>
                )}
            </div>
            
            {showPrivacyNote && <CopilotPrivacyNote themeColor={themeColor} role={role} />}
        </div>
    );
};
