"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { syncFromSupabase } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const router = useRouter();

  const inputStyle = { background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)", color: "#e8d4a0" };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await syncFromSupabase();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email address above first"); return; }
    setForgotLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { setError(error.message); return; }
    setForgotSent(true);
  };

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
          <h1 className="text-amber-200 font-serif font-semibold text-xl">Welcome back</h1>
          <p className="text-amber-700/70 text-sm font-sans mt-1">Sign in to continue your story</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
          {forgotSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-3xl">âœ‰ï¸</div>
              <p className="text-amber-200 font-serif text-sm">Password reset email sent!</p>
              <p className="text-amber-700/60 text-xs font-sans">Check your inbox and follow the link to reset your password.</p>
              <button onClick={() => { setForgotSent(false); setForgotMode(false); }}
                className="text-amber-600 hover:text-amber-400 text-xs font-sans underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={forgotMode ? handleForgotPassword : handleSignIn} className="space-y-4">
              {error && (
                <div className="rounded-lg px-3 py-2 text-sm text-red-400 font-sans"
                  style={{ background: "rgba(200,0,0,0.1)", border: "1px solid rgba(200,0,0,0.2)" }}>
                  {error}
                </div>
              )}

              <div>
                <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif block mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-sans placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                  style={inputStyle} placeholder="you@example.com" />
              </div>

              {!forgotMode && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif">Password</label>
                    <button type="button" onClick={() => { setForgotMode(true); setError(""); }}
                      className="text-[11px] font-sans transition-colors"
                      style={{ color: "rgba(180,120,50,0.7)" }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} required
                      className="w-full rounded-lg px-4 py-2.5 pr-11 text-sm font-sans placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                      style={inputStyle} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(220,175,80,0.92)" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {forgotMode && (
                <p className="text-xs font-sans" style={{ color: "rgba(180,130,60,0.65)" }}>
                  Enter your email above and we'll send you a link to reset your password.
                </p>
              )}

              <Button type="submit" variant="gold" size="md"
                disabled={loading || forgotLoading} className="w-full justify-center">
                {forgotLoading ? "Sendingâ€¦" : loading ? "Signing inâ€¦" : forgotMode ? "Send reset link" : "Sign In"}
              </Button>

              {forgotMode && (
                <button type="button" onClick={() => { setForgotMode(false); setError(""); }}
                  className="w-full text-center text-xs font-sans transition-colors"
                  style={{ color: "rgba(220,175,80,0.92)" }}>
                  Back to sign in
                </button>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-amber-800/60 text-sm font-sans mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-amber-600 hover:text-amber-400 transition-colors">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
