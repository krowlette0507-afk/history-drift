import Link from "next/link";
import { Shield, Lock, Database, Key, Eye, Server, RefreshCw, AlertTriangle } from "lucide-react";

const SECTIONS = [
  {
    icon: Shield,
    title: "Our security commitment",
    body: `History Drift stores some of the most personal content a person can share â€” their life story, memories, and family history. We treat that responsibility with the utmost seriousness.

Every architectural decision we make starts with the question: is this as secure as it can be? We do not cut corners on data protection, and we will never sell or share your personal data.`,
  },
  {
    icon: Server,
    title: "Infrastructure and data storage",
    body: `All data is stored on Supabase, which runs on Amazon Web Services (AWS) infrastructure â€” one of the most secure and audited cloud platforms in the world.

â€¢ Data at rest is encrypted using AES-256, the same standard used by banks and governments
â€¢ All data in transit is encrypted via TLS 1.2+ (HTTPS) â€” it is never sent over an unencrypted connection
â€¢ Supabase data centres are SOC 2 Type II certified and GDPR compliant
â€¢ Database backups are taken daily and retained for 7 days, also encrypted at rest`,
  },
  {
    icon: Lock,
    title: "Row Level Security (RLS)",
    body: `This is the most important security layer we use, and it is worth explaining clearly.

Row Level Security is a database-level policy that makes it impossible for one user to read another user's data â€” even if there were a bug in our application code, or if someone gained unauthorised access to our server.

Every table in our database has RLS enabled. The rules are:
â€¢ Your interview sessions, exchanges, storyboards, biography, and people data can only be read or modified by you â€” authenticated as you
â€¢ Family invite tokens are write-only for contributors â€” they can submit, but cannot read your story
â€¢ Deletion schedules and internal admin tables are restricted to our service role only â€” no user or API route can access them

RLS means your data is protected at the lowest possible level â€” the database itself â€” not just at the application layer.`,
  },
  {
    icon: Key,
    title: "Password storage and protection",
    body: `We never store your password. Not in plain text, not in any reversible form.

Here is exactly what happens when you create a password:

1. You enter your password in the browser
2. Supabase Auth receives it over an encrypted HTTPS connection
3. It is immediately hashed using bcrypt â€” a one-way cryptographic function with a work factor that makes brute-force attacks computationally infeasible
4. Only the hash is stored â€” the original password is discarded and cannot be recovered by anyone, including us

When you log in:
â€¢ Your entered password is hashed using the same algorithm and compared to the stored hash
â€¢ If they match, you are authenticated â€” your actual password is never stored or logged at any point

Additional protections:
â€¢ Passwords must be at least 8 characters
â€¢ You can change your password at any time from Settings
â€¢ If you forget your password, a secure reset link is sent to your email â€” the link expires after 1 hour and can only be used once
â€¢ We use Supabase's built-in rate limiting to block repeated failed login attempts`,
  },
  {
    icon: Eye,
    title: "Who can access your data",
    body: `Only you can access your story data. Within History Drift:

â€¢ Our application server can read your data only when you are authenticated and making a request â€” it cannot access data belonging to other users
â€¢ Our service role (used for admin operations like deletion processing) accesses data only for the specific operation being performed, never browsing or retaining content
â€¢ No History Drift employee has a routine pathway to read your interview content or story data
â€¢ OpenAI receives your content only when you explicitly trigger an AI feature (generating a biography, creating a storyboard, etc.) â€” it is not stored by OpenAI beyond the immediate API call under our zero data retention agreement

Family contributions:
â€¢ People you invite via the Family Memories feature can only submit their own story â€” they cannot access any of your interviews, storyboards, or personal data
â€¢ Each invite link is a unique cryptographic token â€” guessing someone else's token is computationally infeasible`,
  },
  {
    icon: Database,
    title: "API and credential security",
    body: `All API keys, database credentials, and service secrets are stored as server-side environment variables â€” they are never included in client-side code or exposed in the browser.

â€¢ Supabase service role key (which has elevated database access) is only used in server-side API routes, never on the client
â€¢ API routes that perform sensitive operations (account deletion, cron jobs) require a valid Bearer token â€” they cannot be called anonymously
â€¢ The Vercel Cron Job endpoint is protected by a secret key known only to Vercel and our server
â€¢ Our codebase is version-controlled and reviewed â€” credentials are explicitly excluded from git via .gitignore`,
  },
  {
    icon: RefreshCw,
    title: "Data retention and deletion",
    body: `We keep your data only as long as you have an active subscription. When your subscription ends:

â€¢ Your data remains intact for 30 days so you can reactivate without loss
â€¢ You receive an email warning 14 days before permanent deletion
â€¢ After 30 days, all your data is permanently and irreversibly deleted: interviews, storyboards, family memories, biography, people, places, timeline, and your account

You can also request deletion at any time from Settings â†’ Delete my account. Once deletion is confirmed, it cannot be undone.

We do not retain deleted data in backups beyond our 7-day infrastructure backup window, after which it is gone from all systems.`,
  },
  {
    icon: AlertTriangle,
    title: "Incident response",
    body: `In the unlikely event of a security incident that affects your personal data, we will:

â€¢ Notify affected users by email within 72 hours of becoming aware of the breach
â€¢ Describe clearly what data was involved, the likely impact, and what we have done to address it
â€¢ Report to relevant data protection authorities where required by law (e.g. GDPR Article 33)

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
                      className={`font-serif text-sm leading-relaxed ${line.startsWith("â€¢") || /^\d\./.test(line) ? "pl-3" : ""}`}
                      style={{
                        color:
                          line.startsWith("â€¢") || /^\d\./.test(line)
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
          Â© {new Date().getFullYear()} History Drift. All rights reserved.
        </p>
      </div>
    </div>
  );
}
