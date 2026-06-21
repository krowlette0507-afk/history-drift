"use client";

import Button from "@/components/ui/Button";
import { Settings, User, Bell, Lock, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="text-amber-600/60 uppercase tracking-[0.3em] text-xs font-serif mb-1">Preferences</div>
        <h1 className="text-3xl font-serif font-bold text-amber-200">Settings</h1>
      </div>

      <div className="space-y-4">
        {[
          { icon: User, label: "Account & Profile", desc: "Manage your personal information" },
          { icon: Bell, label: "Notifications", desc: "Email and in-app notification preferences" },
          { icon: Lock, label: "Privacy & Security", desc: "Password, two-factor auth, data export" },
          { icon: Palette, label: "Appearance", desc: "Theme and display preferences" },
          { icon: Settings, label: "Interview Preferences", desc: "Default interviewer, language, voice settings" },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-amber-700/40 transition-colors"
            style={{ background: "rgba(30,18,6,0.5)", border: "1px solid rgba(101,67,20,0.25)" }}
          >
            <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-amber-600/70" />
            </div>
            <div className="flex-1">
              <div className="text-amber-200 font-serif font-semibold text-sm">{label}</div>
              <div className="text-amber-700/60 text-xs font-sans">{desc}</div>
            </div>
            <div className="text-amber-800/40 text-lg">›</div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-amber-900/30">
        <Button variant="ghost" size="sm" className="text-red-700/70 hover:text-red-500">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
