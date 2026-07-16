import Link from "next/link";

const SECTIONS = [
  {
    title: "Who we are",
    body: `History Drift is a life story preservation platform operated by History Drift Ltd. We help individuals capture, preserve, and share their personal life stories through AI-guided interviews, illustrated storyboards, and family memory contributions.

Contact: support@historydrift.com`,
  },
  {
    title: "What data we collect",
    body: `When you use History Drift, we collect:

• Account information — your name and email address, provided at sign-up
• Interview content — the questions asked and answers you record during interview sessions
• Story content — any text you write or speak when creating Re-Live storyboards
• Family contributions — memories and photos submitted by people you invite
• Usage data — session timestamps, feature usage, and error logs for improving the service

We do not collect payment card details directly — payments are handled by Stripe, who have their own privacy policy.`,
  },
  {
    title: "How we use your data",
    body: `Your data is used exclusively to provide the History Drift service:

• Interview answers are used to generate your biography, timeline, people index, and life lessons
• Story content is used to generate Re-Live storyboards
• Your email is used to send service notifications, family invite emails, and important account alerts
• We do not sell, rent, or share your personal data with third parties for marketing purposes
• We do not use your story content to train AI models`,
  },
  {
    title: "How your data is secured",
    body: `Security is fundamental to what we do — your life story deserves the highest protection.

• All data is stored in Supabase (AWS infrastructure) with encryption at rest and in transit (TLS/HTTPS)
• Row Level Security (RLS) is enforced at the database level — your data is only accessible to your authenticated account, even if someone attempted to access the database directly
• API keys and service credentials are stored as environment variables and never exposed to the client
• Family invite links are single-use, tokenised, and private — contributors can only submit, not read your story
• We conduct regular reviews of access controls and security policies`,
  },
  {
    title: "Data retention and deletion",
    body: `We retain your data for as long as your account is active or your subscription is current.

When your subscription ends:
• Your data remains accessible for 30 days
• You will receive a warning email 14 days before permanent deletion
• After 30 days, all your data is permanently and irreversibly deleted from our servers — including interviews, storyboards, family memories, biography content, and account information

You may also request immediate account deletion at any time from Settings → Delete my account. This schedules deletion within 30 days, with a 14-day warning email sent at the midpoint. To cancel a deletion request, contact support@historydrift.com before the deletion date.

We do not retain backup copies of deleted accounts beyond our standard 7-day infrastructure backup window.`,
  },
  {
    title: "Your rights",
    body: `You have the right to:

• Access — request a copy of all personal data we hold about you
• Correction — correct inaccurate data (use the People page edit feature or contact us)
• Deletion — request permanent deletion of your account and all associated data
• Portability — request your data in a machine-readable format
• Objection — object to how we process your data

To exercise any of these rights, contact us at support@historydrift.com. We will respond within 30 days.`,
  },
  {
    title: "Cookies",
    body: `History Drift uses only essential cookies required for authentication and session management (provided by Supabase). We do not use advertising cookies or third-party tracking cookies.`,
  },
  {
    title: "Third-party services",
    body: `We use the following third-party services to operate History Drift:

• Supabase — database and authentication (data stored on AWS, us-west-2)
• OpenAI — AI interview questions, story analysis, and image generation (your content is sent to OpenAI's API; OpenAI's data usage policy applies)
• Resend — transactional email delivery
• Vercel — application hosting and deployment
• Stripe — subscription billing and payment processing

Each of these services has its own privacy policy. We select providers who meet high data protection standards.`,
  },
  {
    title: "Children's privacy",
    body: `History Drift is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, contact us at support@historydrift.com and we will delete it promptly.`,
  },
  {
    title: "Changes to this policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email and by posting a notice in the app. Continued use of History Drift after changes take effect constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-5 py-12"
      style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8a5021, #c8843a)" }}>
              <span className="text-amber-100 font-serif font-bold text-xs">HD</span>
            </div>
            <span className="font-serif font-semibold text-amber-400">History Drift</span>
          </Link>
          <h1 className="font-serif font-bold text-3xl mb-2" style={{ color: "#f0d060" }}>
            Privacy Policy
          </h1>
          <p className="font-serif italic text-sm" style={{ color: "rgba(180,130,60,0.7)" }}>
            Last updated: 15 July 2026
          </p>
          <p className="font-serif text-sm leading-relaxed mt-4" style={{ color: "rgba(210,175,100,0.8)" }}>
            Your life story is deeply personal. We take our responsibility to protect it seriously. This policy explains clearly what we collect, how we use it, and how you can control it.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <div key={i} className="pb-8" style={{ borderBottom: "1px solid rgba(80,50,15,0.25)" }}>
              <h2 className="font-serif font-bold text-lg mb-3" style={{ color: "#e8c060" }}>
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.body.split("\n").map((line, j) => (
                  line.trim() ? (
                    <p key={j}
                      className={`font-serif text-sm leading-relaxed ${line.startsWith("•") ? "pl-3" : ""}`}
                      style={{ color: line.startsWith("•") ? "rgba(200,165,90,0.8)" : "rgba(210,175,100,0.85)" }}>
                      {line}
                    </p>
                  ) : <div key={j} className="h-1" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 px-5 py-5 rounded-2xl text-center"
          style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(80,50,15,0.25)" }}>
          <p className="font-serif text-sm" style={{ color: "rgba(180,130,60,0.75)" }}>
            Questions about this policy?{" "}
            <a href="mailto:support@historydrift.com" className="underline" style={{ color: "#c8843a" }}>
              support@historydrift.com
            </a>
          </p>
        </div>

        <p className="text-center text-[11px] font-sans mt-8" style={{ color: "rgba(100,70,25,0.4)" }}>
          © {new Date().getFullYear()} History Drift. All rights reserved.
        </p>
      </div>
    </div>
  );
}
