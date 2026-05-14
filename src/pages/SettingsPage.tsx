import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Check,
  Zap,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Layout,
  Sparkles
} from 'lucide-react';
import { loadSettings, saveSettings } from '../services/settingsService';
import { UserSettings, UserRole } from '../lib/llm/types';
import { useAuth } from '../auth/AuthContext';

interface SettingsPageProps {
  role: UserRole;
}

function areSettingsEqual(a: UserSettings | null, b: UserSettings | null): boolean {
  if (!a || !b) return false;
  return (
    a.role === b.role
    && (a.displayName ?? '') === (b.displayName ?? '')
    && (a.preferredTheme ?? 'system') === (b.preferredTheme ?? 'system')
    && a.copilotPreferences.explanationLength === b.copilotPreferences.explanationLength
    && a.copilotPreferences.tone === b.copilotPreferences.tone
    && a.copilotPreferences.showStepLabels === b.copilotPreferences.showStepLabels
  );
}

export default function SettingsPage({ role }: SettingsPageProps) {
  const { currentUser, updateProfile } = useAuth();
  const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null);
  const [currentSettings, setCurrentSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'copilot'>('copilot');

  useEffect(() => {
    const loaded = loadSettings(role);
    setInitialSettings(loaded);
    setCurrentSettings(loaded);
  }, [role]);

  const isDirty = Boolean(initialSettings && currentSettings && !areSettingsEqual(initialSettings, currentSettings));

  const roleThemes = {
    student: {
      brand: '#68507B',
      light: '#8B7FA0',
      text: 'text-purple-700',
      bg: 'bg-purple-100/40',
      subtitle: 'Adjust how Elora helps you learn.'
    },
    teacher: {
      brand: '#0D9488',
      light: '#F0FDFB',
      text: 'text-teal-700',
      bg: 'bg-teal-100/40',
      subtitle: 'Tweak your teaching tools and preferences.'
    },
    parent: {
      brand: '#D97706',
      light: '#FFFBF0',
      text: 'text-orange-700',
      bg: 'bg-orange-100/40',
      subtitle: 'Set how Elora supports you and your child.'
    }
  };

  const theme = roleThemes[role];

  const handleUpdate = (updates: Partial<UserSettings>) => {
    if (!currentSettings) return;
    setCurrentSettings((prev) => ({
      ...(prev ?? currentSettings),
      ...updates,
      copilotPreferences: updates.copilotPreferences
        ? { ...(prev ?? currentSettings).copilotPreferences, ...updates.copilotPreferences }
        : (prev ?? currentSettings).copilotPreferences,
    }));
  };

  const handleCopilotUpdate = (updates: Partial<UserSettings['copilotPreferences']>) => {
    if (!currentSettings) return;
    handleUpdate({ copilotPreferences: { ...currentSettings.copilotPreferences, ...updates } });
  };

  const handleSave = () => {
    if (!currentSettings) return;
    setIsSaving(true);
    saveSettings(currentSettings);
    if (currentUser?.role === role) {
      updateProfile({
        preferredName: currentSettings.displayName?.trim() || undefined,
      });
    }
    setInitialSettings(currentSettings);
    setShowSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 500);
  };

  const handleCancel = () => {
    if (!initialSettings) return;
    setCurrentSettings(initialSettings);
  };

  if (!currentSettings || !initialSettings) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
        <div className="animate-pulse bg-slate-100 rounded-2xl h-24" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--elora-text-strong)] tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-[var(--elora-text-strong)]" size={32} />
            Settings
          </h1>
          <p className="text-[var(--elora-text-muted)] mt-1 font-medium">{theme.subtitle}</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-semibold shadow-sm"
            >
              <CheckCircle2 size={18} />
              Settings saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-1">
          <button 
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'profile' ? `bg-[var(--elora-surface-alt)] text-[var(--elora-text-strong)]` : 'text-[var(--elora-text-muted)] hover:bg-[var(--elora-surface-alt)] hover:text-[var(--elora-text-strong)]'}`}
          >
            <User size={18} />
            Profile
          </button>
          <button 
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'appearance' ? `bg-[var(--elora-surface-alt)] text-[var(--elora-text-strong)]` : 'text-[var(--elora-text-muted)] hover:bg-[var(--elora-surface-alt)] hover:text-[var(--elora-text-strong)]'}`}
          >
            <Layout size={18} />
            Appearance
          </button>
          <button 
            onClick={() => setActiveSection('copilot')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'copilot' ? `bg-[var(--elora-surface-alt)] text-[var(--elora-text-strong)]` : 'text-[var(--elora-text-muted)] hover:bg-[var(--elora-surface-alt)] hover:text-[var(--elora-text-strong)]'}`}
          >
            <Zap size={18} />
            Copilot Preferences
          </button>
          
          <div className="pt-4 mt-4 border-t border-[var(--elora-border-subtle)]">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
              <Bell size={18} />
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
              <Shield size={18} />
              Security
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--elora-surface-main)] rounded-3xl border border-[var(--elora-border-subtle)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)]">
                <h2 className="text-lg font-bold text-[var(--elora-text-strong)] flex items-center gap-2">
                  <User className="text-[var(--elora-text-strong)]" size={20} />
                  Profile Details
                </h2>
                <p className="text-sm text-[var(--elora-text-muted)] font-medium">How you appear in the Elora ecosystem.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--elora-text-strong)]">Display Name</label>
                  <input
                    type="text"
                    value={currentSettings.displayName || ''}
                    onChange={(e) => handleUpdate({ displayName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--elora-border-subtle)] focus:ring-2 focus:ring-[var(--elora-primary)] focus:border-[var(--elora-border-subtle)] outline-none transition-all font-medium bg-[var(--elora-surface-main)] text-[var(--elora-text-strong)]"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* APPEARANCE SECTION */}
          {activeSection === 'appearance' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--elora-surface-main)] rounded-3xl border border-[var(--elora-border-subtle)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)]">
                <h2 className="text-lg font-bold text-[var(--elora-text-strong)] flex items-center gap-2">
                  <Layout className="text-[var(--elora-text-strong)]" size={20} />
                  Appearance
                </h2>
                <p className="text-sm text-[var(--elora-text-muted)] font-medium">Customize the look and feel of your dashboard.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-[var(--elora-text-strong)] uppercase tracking-widest">Theme Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Theme: Light, Dark, or System">
                    {[
                      { id: 'light', label: 'Light', icon: Sun, description: 'Bright surfaces for daytime use.' },
                      { id: 'dark', label: 'Dark', icon: Moon, description: 'Softer backgrounds and brighter text for low-light use.' },
                      { id: 'system', label: 'System (follow device)', icon: SettingsIcon, description: 'Follow your device theme automatically.' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        role="radio"
                        aria-checked={currentSettings.preferredTheme === t.id}
                        onClick={() => handleUpdate({ preferredTheme: t.id as any })}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          currentSettings.preferredTheme === t.id 
                              ? `border-[${theme.brand}] bg-[${theme.brand}]/5` 
                              : 'border-[var(--elora-border-subtle)] hover:border-[var(--elora-border-subtle)]'
                        }`}
                        style={{ 
                          borderColor: currentSettings.preferredTheme === t.id ? theme.brand : undefined,
                            backgroundColor: currentSettings.preferredTheme === t.id ? `${theme.brand}08` : undefined
                        }}
                      >
                        <t.icon size={24} className={currentSettings.preferredTheme === t.id ? theme.text : 'text-[var(--elora-text-muted)]'} />
                        <span className={`text-sm font-bold ${currentSettings.preferredTheme === t.id ? 'text-[var(--elora-text-strong)]' : 'text-[var(--elora-text-muted)]'}`}>
                          {t.label}
                        </span>
                        <span className="text-[11px] text-[var(--elora-text-muted)] text-center leading-relaxed">{t.description}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--elora-text-muted)] leading-relaxed">
                    Dark mode uses softer backgrounds and brighter text to reduce eye strain in low-light environments.
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {/* COPILOT PREFERENCES SECTION */}
          {activeSection === 'copilot' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--elora-surface-main)] rounded-3xl border border-[var(--elora-border-subtle)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)]">
                <h2 className="text-lg font-bold text-[var(--elora-text-strong)] flex items-center gap-2">
                  <Sparkles className="text-[var(--elora-text-strong)]" size={20} />
                  Copilot Preferences
                </h2>
                <p className="text-sm text-[var(--elora-text-muted)] font-medium">Customize how Elora interacts and explains concepts.</p>
              </div>

              <div className="p-8 space-y-10">
                {/* Explanation Length */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-[var(--elora-text-strong)] uppercase tracking-widest">Explanation Detail</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['short', 'normal', 'detailed'] as const).map((len) => (
                      <button
                        key={len}
                        onClick={() => handleCopilotUpdate({ explanationLength: len })}
                        className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                            currentSettings.copilotPreferences.explanationLength === len 
                              ? `border-[${theme.brand}] bg-[${theme.brand}]/5 ring-1 ring-[${theme.brand}]` 
                              : 'border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] hover:border-[var(--elora-border-subtle)]'
                          }`}
                        style={{ 
                          borderColor: currentSettings.copilotPreferences.explanationLength === len ? theme.brand : undefined,
                            backgroundColor: currentSettings.copilotPreferences.explanationLength === len ? `${theme.brand}08` : undefined
                        }}
                      >
                        {currentSettings.copilotPreferences.explanationLength === len && (
                          <div className="absolute top-3 right-3" style={{ color: theme.brand }}>
                            <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                          </div>
                        )}
                        <span className={`text-sm font-bold capitalize ${currentSettings.copilotPreferences.explanationLength === len ? 'text-[var(--elora-text-strong)]' : 'text-[var(--elora-text-muted)]'}`}>
                          {len}
                        </span>
                        <span className="text-[11px] text-[var(--elora-text-muted)] mt-1 leading-relaxed">
                          {len === 'short' && 'Quick, punchy answers for fast reviews.'}
                          {len === 'normal' && 'The perfect balance of depth and speed.'}
                          {len === 'detailed' && 'Step-by-step deep dives for thorough learning.'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-[var(--elora-text-strong)] uppercase tracking-widest">Conversation Tone</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['neutral', 'encouraging'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleCopilotUpdate({ tone: t })}
                        className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                            currentSettings.copilotPreferences.tone === t 
                              ? `border-[${theme.brand}] bg-[${theme.brand}]/5 ring-1 ring-[${theme.brand}]` 
                              : 'border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] hover:border-[var(--elora-border-subtle)]'
                          }`}
                        style={{ 
                          borderColor: currentSettings.copilotPreferences.tone === t ? theme.brand : undefined,
                            backgroundColor: currentSettings.copilotPreferences.tone === t ? `${theme.brand}08` : undefined
                        }}
                      >
                        {currentSettings.copilotPreferences.tone === t && (
                          <div className="absolute top-3 right-3" style={{ color: theme.brand }}>
                            <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                          </div>
                        )}
                        <span className={`text-sm font-bold capitalize ${currentSettings.copilotPreferences.tone === t ? 'text-[var(--elora-text-strong)]' : 'text-[var(--elora-text-muted)]'}`}>
                          {t}
                        </span>
                        <span className="text-[11px] text-[var(--elora-text-muted)] mt-1 leading-relaxed">
                          {t === 'neutral' && 'Calm, balanced, and strictly educational.'}
                          {t === 'encouraging' && 'Warm, supportive, and highly empathetic.'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--elora-surface-alt)] rounded-2xl border border-[var(--elora-border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme.bg} ${theme.text}`}>
                        <Eye size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--elora-text-strong)]">Show Step Labels</p>
                        <p className="text-xs text-[var(--elora-text-muted)]">Explicitly label steps (e.g., "Step 1: ...") or "Given/Goal" in explanations.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopilotUpdate({ showStepLabels: !currentSettings.copilotPreferences.showStepLabels })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${currentSettings.copilotPreferences.showStepLabels ? '' : 'bg-slate-200'}`}
                      style={{ backgroundColor: currentSettings.copilotPreferences.showStepLabels ? theme.brand : undefined }}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${currentSettings.copilotPreferences.showStepLabels ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-4 bg-[var(--elora-surface-alt)] border-t border-[var(--elora-border-subtle)] flex items-center gap-2 text-[11px] font-bold text-[var(--elora-text-muted)] uppercase tracking-widest">
                <AlertCircle size={14} />
                These preferences will be applied to all future Copilot conversations.
              </div>
            </motion.section>
          )}

          {/* PRIVACY INFO */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex items-start gap-4">
              <div className={`p-3 ${theme.bg} rounded-2xl`}>
                <Shield className={theme.text} size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 text-slate-900">Local Settings Control</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                  Your settings are stored locally on this device for privacy. No personal preference data is used for training Elora's core models.
                </p>
              </div>
            </div>
          </div>
          {!isDirty ? (
            <div className="flex justify-end items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <Check size={14} />
                Saved
              </span>
            </div>
          ) : (
            <div className="flex justify-end items-center gap-3">
              <button onClick={handleCancel} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl text-white font-semibold shadow hover:opacity-95 disabled:opacity-60" style={{ backgroundColor: theme.brand }}>Save changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
