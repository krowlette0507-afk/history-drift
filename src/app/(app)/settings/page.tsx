"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Lock, LogOut, Check, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "password">("profile");

  // Profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteScheduled, setDeleteScheduled] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      setFullName(user.user_metadata?.full_name ?? "");
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setProfileSaving(false);
    setProfileMsg(error ? `Error: ${error.message}` : "Profile updated");
    setTimeout(() => setProfileMsg(""), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    // Re-authenticate then update
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInErr) {
      setPasswordSaving(false);
      setPasswordError("Current password is incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPasswordMsg(""), 3000);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  async function requestDeletion() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    const data = await res.json();
    setDeleting(false);
    if (data.ok) {
      const d = new Date(data.scheduledFor).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      setDeleteScheduled(d);
      setShowDeleteConfirm(false);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-amber-700/50";
  const inputStyle = { background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)", color: "#e8d4a0" };

  return (
    <div className="px-5 py-8 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-sans uppercase tracking-widest mb-1" style={{ color: "rgba(215,170,75,0.92)" }}>Preferences</div>
        <h1 className="font-serif font-bold text-2xl" style={{ color: "#f0d060" }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,55,15,0.3)" }}>
        {([["profile", User, "Profile"], ["password", Lock, "Password"]] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-serif transition-all"
            style={{
              background: tab === key ? "rgba(122,45,138,0.35)" : "transparent",
              color: tab === key ? "#e0a0f0" : "rgba(225,185,80,0.92)",
              border: tab === key ? "1px solid rgba(200,74,154,0.3)" : "1px solid transparent",
            }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5" style={{ color: "rgba(225,185,80,0.92)" }}>
              Full name
            </label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5" style={{ color: "rgba(225,185,80,0.92)" }}>
              Email address
            </label>
            <input value={email} disabled
              className={inputCls} style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
            <p className="text-[10px] font-sans mt-1" style={{ color: "rgba(200,160,70,0.88)" }}>
              Email cannot be changed here â€” contact support
            </p>
          </div>
          <button type="submit" disabled={profileSaving}
            className="w-full py-3 rounded-xl font-serif font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
            {profileSaving ? <Loader2 size={15} className="animate-spin" /> : profileMsg ? <><Check size={15} />{profileMsg}</> : "Save changes"}
          </button>
        </form>
      )}

      {/* Password tab */}
      {tab === "password" && (
        <form onSubmit={changePassword} className="space-y-4">
          {passwordError && (
            <div className="px-4 py-3 rounded-xl text-sm font-sans" style={{ background: "rgba(200,0,0,0.12)", border: "1px solid rgba(200,0,0,0.25)", color: "#f08080" }}>
              {passwordError}
            </div>
          )}

          {[
            { label: "Current password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: "New password", value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, value, set, show, toggle }) => (
            <div key={label}>
              <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5" style={{ color: "rgba(225,185,80,0.92)" }}>
                {label}
              </label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={value} onChange={(e) => set(e.target.value)}
                  required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className={inputCls + " pr-11"} style={inputStyle} />
                <button type="button" onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(220,175,80,0.92)" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <button type="submit" disabled={passwordSaving}
            className="w-full py-3 rounded-xl font-serif font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
            {passwordSaving ? <Loader2 size={15} className="animate-spin" /> : passwordMsg ? <><Check size={15} />{passwordMsg}</> : "Update password"}
          </button>
        </form>
      )}

      {/* Sign out */}
      <div className="mt-10 pt-6 space-y-6" style={{ borderTop: "1px solid rgba(90,55,15,0.25)" }}>
        <button onClick={signOut}
          className="flex items-center gap-2 text-sm font-serif transition-all"
          style={{ color: "rgba(200,80,80,0.7)" }}>
          <LogOut size={14} /> Sign out
        </button>

        {/* Delete account */}
        <div className="rounded-xl p-4" style={{ background: "rgba(80,10,10,0.2)", border: "1px solid rgba(160,40,40,0.25)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={13} style={{ color: "rgba(200,80,80,0.7)" }} />
            <span className="font-serif font-semibold text-sm" style={{ color: "rgba(220,100,100,0.85)" }}>Delete my account</span>
          </div>
          {deleteScheduled ? (
            <p className="text-xs font-sans leading-relaxed" style={{ color: "rgba(200,120,120,0.8)" }}>
              Your account and all data is scheduled for permanent deletion on <strong>{deleteScheduled}</strong>. You'll receive a reminder email 14 days before. Contact <a href="mailto:support@historydrift.com" className="underline">support@historydrift.com</a> to cancel.
            </p>
          ) : (
            <>
              <p className="text-xs font-sans leading-relaxed mb-3" style={{ color: "rgba(180,100,100,0.75)" }}>
                This will permanently delete all your interviews, storyboards, family memories, and account data after 30 days. You'll receive a warning email 14 days before deletion. This cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-sans px-3 py-1.5 rounded-lg transition-all"
                  style={{ border: "1px solid rgba(160,40,40,0.4)", color: "rgba(200,80,80,0.8)", background: "rgba(80,10,10,0.3)" }}>
                  Request account deletion
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-sans" style={{ color: "rgba(220,120,120,0.9)" }}>
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg px-3 py-2 text-sm font-sans focus:outline-none"
                    style={{ background: "rgba(40,5,5,0.8)", border: "1px solid rgba(160,40,40,0.4)", color: "#f0a0a0" }} />
                  <div className="flex gap-2">
                    <button onClick={requestDeletion} disabled={deleteConfirmText !== "DELETE" || deleting}
                      className="px-3 py-1.5 rounded-lg text-xs font-sans font-semibold disabled:opacity-40 transition-all"
                      style={{ background: "rgba(160,30,30,0.8)", color: "white" }}>
                      {deleting ? <Loader2 size={12} className="animate-spin inline" /> : "Confirm deletion"}
                    </button>
                    <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-sans"
                      style={{ color: "rgba(160,100,100,0.6)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
