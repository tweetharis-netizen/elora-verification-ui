import { UserSettings, UserRole } from '../lib/llm/types';

const SETTINGS_KEY_PREFIX = 'elora_settings_';

const DEFAULT_SETTINGS = (role: UserRole): UserSettings => ({
  role,
  preferredTheme: 'system',
  copilotPreferences: {
    explanationLength: 'normal',
    tone: 'encouraging',
    showStepLabels: true,
  },
});

function mergeSettings(role: UserRole, stored?: Partial<UserSettings>): UserSettings {
  const defaults = DEFAULT_SETTINGS(role);
  return {
    ...defaults,
    ...(stored ?? {}),
    role,
    copilotPreferences: {
      ...defaults.copilotPreferences,
      ...(stored?.copilotPreferences ?? {}),
    },
  };
}

export const settingsService = {
  getSettings(role: UserRole): UserSettings {
    const stored = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${role}`);
    if (!stored) return DEFAULT_SETTINGS(role);
    try {
      return mergeSettings(role, JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return DEFAULT_SETTINGS(role);
    }
  },

  saveSettings(settings: UserSettings): void {
    const normalized = mergeSettings(settings.role, settings);
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${settings.role}`, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('elora-settings-updated', { detail: normalized }));
  },

  updateSettings(role: UserRole, updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings(role);
    const updated = {
      ...current,
      ...updates,
      copilotPreferences: updates.copilotPreferences
        ? { ...current.copilotPreferences, ...updates.copilotPreferences }
        : current.copilotPreferences
    };
    this.saveSettings(updated);
    return updated;
  }
};

export const loadSettings = (role: UserRole): UserSettings => settingsService.getSettings(role);

export const saveSettings = (settings: UserSettings): void => {
  settingsService.saveSettings(settings);
};
