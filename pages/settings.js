// pages/settings.js
import {
  getTheme,
  setTheme,
  getLearningPrefs,
  setLearningPrefs,
  getFontScale,
  setFontScale,
  activateTeacher,
  getSession,
  saveSession,
} from '@/lib/session';
import { useState } from 'react';

export default function Settings() {
  const [theme, setThemeState] = useState(getTheme());
  const [font, setFont] = useState(getFontScale());
  const [prefs, setPrefs] = useState(getLearningPrefs());
  const [invite, setInvite] = useState('');

  const handleApplyInvite = async () => {
    const res = await fetch(`/api/teacher-invite?code=${invite}`);
    if (res.ok) {
      activateTeacher(invite);
      alert('✅ Educator mode unlocked');
    } else alert('Invalid invite');
  };

  const updateTheme = (t) => {
    setTheme(t);
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  return (
    <div className="mt-20 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Settings</h1>

      <div className="bg-white/10 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Appearance</h2>
        <div className="flex gap-3">
          {['system', 'light', 'dark'].map((m) => (
            <button
              key={m}
              onClick={() => updateTheme(m)}
              className={`px-3 py-1 rounded ${
                theme === m ? 'bg-blue-600 text-white' : 'bg-white/10'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label>Font size:</label>
          <input
            type="range"
            min="0.9"
            max="1.3"
            step="0.1"
            value={font}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setFont(v);
              setFontScale(v);
            }}
          />
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Learning preferences</h2>
        <label>Mode:</label>
        <select
          value={prefs.mode}
          onChange={(e) =>
            setPrefs({ ...prefs, mode: e.target.value }) ||
            setLearningPrefs({ ...prefs, mode: e.target.value })
          }
          className="ml-2 bg-white/10 p-1 rounded"
        >
          <option value="guided">Guided</option>
          <option value="socratic">Socratic</option>
        </select>

        <div className="mt-2">
          <label>Hint style:</label>
          <select
            value={prefs.hintStyle}
            onChange={(e) =>
              setPrefs({ ...prefs, hintStyle: e.target.value }) ||
              setLearningPrefs({ ...prefs, hintStyle: e.target.value })
            }
            className="ml-2 bg-white/10 p-1 rounded"
          >
            <option value="gentle">Gentle</option>
            <option value="direct">Direct</option>
          </select>
        </div>

        <div className="mt-2">
          <label>Attempts before reveal: </label>
          <input
            type="number"
            value={prefs.attemptsBeforeReveal}
            min="1"
            max="5"
            className="ml-2 w-16 bg-white/10 p-1 rounded text-center"
            onChange={(e) =>
              setPrefs({ ...prefs, attemptsBeforeReveal: +e.target.value }) ||
              setLearningPrefs({
                ...prefs,
                attemptsBeforeReveal: +e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Educator access</h2>
        <p className="text-sm mb-2">
          Enter your invite code or use the link shared by admin.
        </p>
        <input
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
          placeholder="Invite code"
          className="w-full p-2 mb-2 rounded bg-white/20"
        />
        <button
          onClick={handleApplyInvite}
          className="w-full py-2 bg-green-600 text-white rounded-md"
        >
          Apply Invite
        </button>
      </div>
    </div>
  );
}
