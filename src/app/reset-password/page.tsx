"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Supabase puts the session tokens in the URL hash after the reset link is clicked
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  const inputStyle = { background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)", color: "#e8d4a0" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8a5021, #c8843a)" }}>
              <span className="text-amber-100 font-serif font-bold text-sm">HD</span>
            </div>
            <span className="text-2xl font-serif font-bold"
              style={{ background: "linear-gradient(135deg, #d4a017, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              History Drift
            </span>
          </Link>
          <h1 className="text-amber-200 font-serif font-semibold text-xl">Set new password</h1>
          <p className="text-amber-700/70 text-sm font-sans mt-1">Choose a strong password for your account</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)" }}>
                <Check size={24} color="white" />
              </div>
              <p className="text-amber-200 font-serif">Password updated!</p>
              <p className="text-amber-700/60 text-xs font-sans">Redirecting to your dashboard…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6 space-y-3">
              <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#c8843a" }} />
              <p className="text-amber-700/60 text-sm font-sans">Verifying your reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="rounded-lg px-3 py-2 text-sm text-red-400 font-sans"
                  style={{ background: "rgba(200,0,0,0.1)", border: "1px solid rgba(200,0,0,0.2)" }}>
                  {error}
                </div>
              )}
              {[
                { label: "New password", value: password, set: setPassword, show: showPassword, toggle: () => setShowPassword(v => !v) },
                { label: "Confirm password", value: confirm, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, value, set, show, toggle }) => (
                <div key={label}>
                  <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif block mb-1">{label}</label>
                  <div className="relative">
                    <input type={show ? "text" : "password"} value={value}
                      onChange={(e) => set(e.target.value)} required minLength={8}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-lg px-4 py-2.5 pr-11 text-sm font-sans placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                      style={inputStyle} />
                    <button type="button" onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(160,110,50,0.6)" }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-serif font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
