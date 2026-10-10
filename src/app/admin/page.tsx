"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_authorized") {
      setError("Your Google account is not authorised as an admin. Contact the super admin.");
    } else if (params.get("error") === "auth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <p className="font-serif text-xs text-gold/40 uppercase tracking-widest mb-2">Admin Access</p>
        <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text">History Drift</h1>
        <p className="font-serif text-sm text-[#f5ead8]/40 mt-1">Sign in to manage the celebration</p>
      </div>

      <div className="warm-glass rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-sm"
        style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-serif text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "white", color: "#1a1208" }}
        >
          {loading ? (
            <span className="animate-pulse">Redirecting to Google…</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c10.9 0 20.1-8.1 20.1-20.5 0-1.3-.1-2.7-.5-5z"/>
                <path fill="#FF3D00" d="M6.3 15.1l6.6 4.9C14.6 16.5 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.6z"/>
                <path fill="#4CAF50" d="M24 45.5c5.1 0 9.7-1.9 13.2-5l-6.1-5.2C29.2 36.8 26.7 37.5 24 37.5c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.9 41.2 16.4 45.5 24 45.5z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.1-2.2 3.9-4 5.2l6.1 5.2C40.6 35.1 44 30.5 44 25c0-1.3-.1-2.7-.4-5z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <p className="font-serif text-xs text-red-400 text-center">{error}</p>
        )}

        <p className="font-serif text-[10px] text-[#f5ead8]/20 text-center leading-relaxed">
          Only authorised admin email addresses can access this dashboard.
        </p>
      </div>
    </div>
  );
}
