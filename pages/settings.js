// pages/settings.js
import {
  getTheme,
  setTheme,
  getFontScale,
  setFontScale,
  activateTeacher,
} from "@/lib/session";
import { useState } from "react";

export default function Settings() {
  const [theme, setThemeState] = useState(getTheme());
  const [font, setFont] = useState(getFontScale());
  const [invite, setInvite] = useState("");
  const [notifications, setNotifications] = useState(true);

  const handleApplyInvite = async () => {
    const res = await fetch(`/api/teacher-invite?code=${invite}`);
    if (res.ok) {
      activateTeacher(invite);
      alert("✅ Educator mode unlocked");
    } else alert("Invalid invite");
  };

  const updateTheme = (t) => {
    setTheme(t);
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  return (
    <div className="mt-20 max-w-xl mx-auto space-y-6 text-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-center text-white">Settings</h1>

      <div className="bg-white/10 rounded-lg p-5 shadow-lg">
        <h2 className="font-semibold mb-3 text-lg">Appearance & Personalization</h2>
        <div className="flex gap-3 mb-3">
          {["System", "Light", "Dark"].map((m) => (
            <button
              key={m}
              onClick={() => updateTheme(m.toLowerCase())}
              className={`px-3 py-1 rounded ${
                theme === m.toLowerCase()
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <label className="block mb-1">Font Size</label>
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

      <div className="bg-white/10 rounded-lg p-5 shadow-lg">
        <h2 className="font-semibold mb-3 text-lg">Notifications</h2>
        <div className="flex items-center justify-between">
          <span>Allow email updates & lesson reminders</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-5 shadow-lg">
        <h2 className="font-semibold mb-3 text-lg">Educator Access</h2>
        <p className="text-sm mb-2 opacity-80">
          Enter your invite code or use the link shared by admin.
        </p>
        <input
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
          placeholder="Invite code"
          className="w-full p-2 mb-2 rounded bg-white/20 text-white placeholder-gray-300"
        />
        <button
          onClick={handleApplyInvite}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Apply Invite
        </button>
      </div>
    </div>
  );
}
