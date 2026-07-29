"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}
    >
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
          <h1 className="text-amber-200 font-serif font-semibold text-xl">Begin Your Story</h1>
          <p className="text-amber-700/70 text-sm font-sans mt-1">Create your free account</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
          {success ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <div className="text-5xl">✉️</div>
              <div>
                <p className="text-amber-200 font-serif text-lg font-semibold">Check your email</p>
                <p className="text-amber-400 font-sans text-sm mt-1 break-all">{email}</p>
              </div>
              <p className="text-amber-600/80 font-sans text-sm leading-relaxed">
                We sent a confirmation link to that address. Click it to activate your account, then come back and sign in.
              </p>
              <Link href="/sign-in"
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-serif font-semibold transition-colors"
                style={{ background: "rgba(200,132,58,0.15)", border: "1px solid rgba(200,132,58,0.4)", color: "#d4a017" }}>
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="rounded-lg px-3 py-2 text-sm text-red-400 font-sans" style={{ background: "rgba(200,0,0,0.1)", border: "1px solid rgba(200,0,0,0.2)" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif block mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-sans text-amber-200 placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                  style={{ background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)" }}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-sans text-amber-200 placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                  style={{ background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)" }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-amber-600/70 text-xs uppercase tracking-wider font-serif block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg px-4 py-2.5 pr-11 text-sm font-sans text-amber-200 placeholder-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                    style={{ background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.4)" }}
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(220,175,80,0.92)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" variant="gold" size="md" disabled={loading} className="w-full justify-center">
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-amber-800/60 text-sm font-sans mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-amber-600 hover:text-amber-400 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
