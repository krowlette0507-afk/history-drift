"use client";

import { Lock, Users, Share2, Shield } from "lucide-react";
import Button from "@/components/ui/Button";

export default function VaultPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="text-amber-600/60 uppercase tracking-[0.3em] text-xs font-serif mb-1">Private & Secure</div>
        <h1 className="text-3xl font-serif font-bold text-amber-200">Family Vault</h1>
        <p className="text-amber-700/70 font-serif italic text-sm mt-1">
          Privately share your legacy with family
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: Lock, title: "End-to-End Security", desc: "Your stories are encrypted and only accessible by people you invite." },
          { icon: Users, title: "Family Sharing", desc: "Invite family members to read, listen, and contribute their own memories." },
          { icon: Share2, title: "Controlled Access", desc: "Choose exactly what each person can see. Revoke access at any time." },
          { icon: Shield, title: "Legacy Protection", desc: "Your vault is preserved and transferred according to your wishes." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl p-5" style={{ background: "rgba(30,18,6,0.5)", border: "1px solid rgba(101,67,20,0.25)" }}>
            <Icon size={18} className="text-amber-600/70 mb-3" />
            <h3 className="text-amber-200 font-serif font-semibold text-sm mb-1">{title}</h3>
            <p className="text-amber-700/60 text-xs font-sans leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Setup CTA */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "linear-gradient(135deg, rgba(62,38,14,0.5), rgba(20,12,4,0.7))", border: "1px solid rgba(212,160,23,0.2)" }}
      >
        <Lock size={28} className="text-amber-700/60 mx-auto mb-3" />
        <h2 className="text-amber-200 font-serif font-semibold text-lg mb-2">Set Up Your Family Vault</h2>
        <p className="text-amber-700/60 text-sm font-sans max-w-xs mx-auto mb-6">
          Invite your first family member to begin sharing your story privately and securely.
        </p>
        <Button variant="gold">Invite Family Member</Button>
      </div>
    </div>
  );
}
