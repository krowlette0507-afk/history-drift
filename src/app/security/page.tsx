import Link from "next/link";
import { Shield, Lock, Database, Key, Eye, Server, RefreshCw, AlertTriangle } from "lucide-react";

const SECTIONS = [
  {
    icon: Shield,
    title: "Our security commitment",
    body: `History Drift stores some of the most personal content a person can share — their life story, memories, and family history. We treat that responsibility with the utmost seriousness.

Every architectural decision we make starts with the question: is this as secure as it can be? We do not cut corners on data protection, and we will never sell or share your personal data.`,
  },
  {
    icon: Server,
    title: "Infrastructure and data storage",
    body: `All data is stored on Supabase, which runs on Amazon Web Services (AWS) infrastructure — one of the most secure and audited cloud platforms in the world.

• Data at rest is encrypted using AES-256, the same standard used by banks and governments
• All data in transit is encrypted via TLS 1.2+ (HTTPS) — it is never sent over an unencrypted connection
• Supabase data centres are SOC 2 Type II certified and GDPR compliant
• Database backups are taken daily and retained for 7 days, also encrypted at rest`,
  },
  {
    icon: Lock,
    title: "Row Level Security (RLS)",
    body: `This is the most important security layer we use, and it is worth explaining clearly.

Row Level Security is a database-level policy that makes it impossible for one user to read another user's data — even if there were a bug in our application code, or if someone gained unauthorised access to our server.

Every table in our database has RLS enabled. The rules are:
• Your interview sessions, exchanges, storyboards, biography, and people data can only be read or modified by you — authenticated as you
• Family invite tokens are write-only for contributors — they can submit, but cannot read your story
• Deletion schedules and internal admin tables are restricted to our service role only — no user or API route can access them

RLS means your data is protected at the lowest possible level — the database itself — not just at the application layer.`,
  },
  {
    icon: Key,
    title: "Password storage and protection",
    body: `We never store your password. Not in plain text, not in any reversible form.

Here is exactly what happens when you create a password:

1. You enter your password in the browser
2. Supabase Auth receives it over an encrypted HTTPS connection
3. It is immediately hashed using bcrypt — a one-way cryptographic function with a work factor that makes brute-force attacks computationally infeasible
4. Only the hash is stored — the original password is discarded and cannot be recovered by anyone, including us

When you log in:
• Your entered password is hashed using the same algorithm and compared to the stored hash
• If they match, you are authenticated — your actual password is never stored or logged at any point

Additional protections:
• Passwords must be at least 8 characters
• You can change your password at any time from Settings
• If you forget your password, a secure reset link is sent to your email — the link expires after 1 hour and can only be used once
• We use Supabase's built-in rate limiting to block repeated failed login attempts`,
  },
  {
    icon: Eye,
    title: "Who can access your data",
    body: `Only you can access your story data. Within History Drift:

• Our application server can read your data only when you are authenticated and making a request — it cannot access data belonging to other users
• Our service role (used for admin operations like deletion processing) accesses data only for the specific operation being performed, never browsing or retaining content
• No History Drift employee has a routine pathway to read your interview content or story data
• OpenAI receives your content only when you explicitly trigger an AI feature (generating a biography, creating a storyboard, etc.) — it is not stored by OpenAI beyond the immediate API call under our zero data retention agreement

Family contributions:
• People you invite via the Family Memories feature can only submit their own story — they cannot access any of your interviews, storyboards, or personal data
• Each invite link is a unique cryptographic token — guessing someone else's token is computationally infeasible`,
  },
  {
    icon: Database,
    title: "API and credential security",
    body: `All API keys, database credentials, and service secrets are stored as server-side environment variables — they are never included in client-side code or exposed in the browser.

• Supabase service role key (which has elevated database access) is only used in server-side API routes, never on the client
• API routes that perform sensitive operations (account deletion, cron jobs) require a valid Bearer token — they cannot be called anonymously
• The Vercel Cron Job endpoint is protected by a secret key known only to Vercel and our server
• Our codebase is version-controlled and reviewed — credentials are explicitly excluded from git via .gitignore`,
  },
  {
    icon: RefreshCw,
    title: "Data retention and deletion",
    body: `We keep your data only as long as you have an active subscription. When your subscription ends:

• Your data remains intact for 30 days so you can reactivate without loss
• You receive an email warning 14 days before permanent deletion
• After 30 days, all your data is permanently and irreversibly deleted: interviews, storyboards, family memories, biography, people, places, timeline, and your account

You can also request deletion at any time from Settings â†’ Delete my account. Once deletion is confirmed, it cannot be undone.

We do not retain deleted data in backups beyond our 7-day infrastructure backup window, after which it is gone from all systems.`,
  },
  {
    icon: AlertTriangle,
    title: "Incident response",
    body: `In the unlikely event of a security incident that affects your personal data, we will:

• Notify affected users by email within 72 hours of becoming aware of the breach
• Describe clearly what data was involved, the likely impact, and what we have done to address it
• Report to relevant data protection authorities where required by law (e.g. GDPR Article 33)

To report a security vulnerability, please email support@historydrift.com. We take all reports seriously and will respond within 24 hours.`,
  },
];

export default function SecurityPage() {
  return (
    <div
      className="min-h-screen px-5 py-12"
      style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8a5021, #c8843a)" }}
            >
              <span className="text-amber-100 font-serif font-bold text-xs">HD</span>
            </div>
            <span className="font-serif font-semibold text-amber-400">History Drift</span>
          </Link>

          {/* Shield badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-sans uppercase tracking-widest"
            style={{ background: "rgba(20,80,40,0.3)", border: "1px solid rgba(40,160,80,0.3)", color: "rgba(80,200,120,0.9)" }}
          >
            <Shield size={11} /> Security & Data Protection
          </div>

          <h1 className="font-serif font-bold text-3xl mb-2" style={{ color: "#f0d060" }}>
            How we protect your data
          </h1>
          <p className="font-serif italic text-sm mb-4" style={{ color: "rgba(225,185,80,0.95)" }}>
            Last updated: 15 July 2026
          </p>
          <p className="font-serif text-sm leading-relaxed" style={{ color: "rgba(235,205,120,0.95)" }}>
            Your life story is irreplaceable. This page explains in plain language every measure we take to keep your data safe, private, and in your control.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={i}
              className="rounded-2xl p-6"
              style={{ background: "rgba(18,11,4,0.6)", border: "1px solid rgba(80,50,15,0.25)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(30,80,20,0.4)", border: "1px solid rgba(40,120,50,0.3)" }}
                >
                  <Icon size={15} style={{ color: "rgba(80,200,120,0.85)" }} />
                </div>
                <h2 className="font-serif font-bold text-base" style={{ color: "#e8c060" }}>
                  {title}
                </h2>
              </div>
              <div className="space-y-2">
                {body.split("\n").map((line, j) =>
                  line.trim() ? (
                    <p
                      key={j}
                      className={`font-serif text-sm leading-relaxed ${line.startsWith("•") || /^\d\./.test(line) ? "pl-3" : ""}`}
                      style={{
                        color:
                          line.startsWith("•") || /^\d\./.test(line)
                            ? "rgba(230,195,110,0.95)"
                            : "rgba(235,205,120,0.97)",
                      }}
                    >
                      {line}
                    </p>
                  ) : (
                    <div key={j} className="h-1" />
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div
          className="mt-10 px-5 py-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(80,50,15,0.25)" }}
        >
          <p className="font-serif text-sm text-center sm:text-left" style={{ color: "rgba(180,130,60,0.75)" }}>
            Questions?{" "}
            <a href="mailto:support@historydrift.com" className="underline" style={{ color: "#c8843a" }}>
              support@historydrift.com
            </a>
          </p>
          <Link
            href="/privacy"
            className="font-serif text-sm underline"
            style={{ color: "rgba(220,175,80,0.95)" }}
          >
            Privacy Policy â†’
          </Link>
        </div>

        <p className="text-center text-[11px] font-sans mt-8" style={{ color: "rgba(190,155,65,0.80)" }}>
          © {new Date().getFullYear()} History Drift. All rights reserved.
        </p>
      </div>
    </div>
  );
}
