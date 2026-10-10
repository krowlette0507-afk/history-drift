"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your account…");

  useEffect(() => {
    const handle = async () => {
      // Exchange the OAuth code for a session
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.replace("/admin?error=auth_failed");
        return;
      }

      setStatus("Checking admin access…");

      // Ask the server to look up this email in celebration_admins
      const res = await fetch("/api/admin/auth-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
      });
      const data = await res.json();

      if (!res.ok || !data.admin_token) {
        router.replace("/admin?error=not_authorized");
        return;
      }

      setStatus("Access granted — loading dashboard…");
      router.replace(`/admin/${data.admin_token}`);
    };

    handle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
      <p className="font-serif text-sm text-gold/50 animate-pulse">{status}</p>
    </div>
  );
}
