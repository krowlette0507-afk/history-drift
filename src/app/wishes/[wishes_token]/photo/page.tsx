"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function WishesPhotoPage() {
  const { wishes_token } = useParams<{ wishes_token: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).slice(0, 10);
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))].slice(0, 10));
    setCaptions((prev) => [...prev, ...picked.map(() => "")].slice(0, 10));
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setCaptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "celebrate-media");
    const res = await fetch("/api/celebrate/upload-image", { method: "POST", body: formData });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Upload failed");
    return d.url;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (files.length === 0) { setError("Please add at least one photo."); return; }

    setSaving(true);
    setError("");
    try {
      const media = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round((i / files.length) * 80));
        const url = await uploadFile(files[i]);
        media.push({ media_type: "image", file_url: url, caption: captions[i] ?? "", original_filename: files[i].name });
      }
      setProgress(90);
      const res = await fetch("/api/wishes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishes_token, name, relationship, message, media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setProgress(100);
      router.push(`/wishes/${wishes_token}?wished=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
      setProgress(0);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(212,160,23,0.2)",
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(212,160,23,0.08)", color: "rgba(212,160,23,0.5)" }}
        >
          ←
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text">Send a Photo</h1>
          <p className="font-serif text-[#f5ead8]/50 text-sm">Up to 10 photos per submission.</p>
        </div>
      </div>

      {/* About you */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">About you</p>
        <input type="text" placeholder="Your name *" value={name}
          onChange={(e) => setName(e.target.value)} required className={inputClass} style={inputStyle} />
        <input type="text" placeholder="Your relationship (e.g. cousin, old friend…)" value={relationship}
          onChange={(e) => setRelationship(e.target.value)} className={inputClass} style={inputStyle} />
      </div>

      {/* Photo picker */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Photos</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilePick} />

        {previews.length === 0 ? (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full py-10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-gold/40"
            style={{ border: "2px dashed rgba(212,160,23,0.2)", background: "rgba(212,160,23,0.03)" }}>
            <span className="text-3xl">📷</span>
            <span className="font-serif text-sm text-gold/50">Tap to choose photos</span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ))}
              {files.length < 10 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg flex items-center justify-center text-2xl transition-colors"
                  style={{ border: "2px dashed rgba(212,160,23,0.2)", background: "rgba(212,160,23,0.03)" }}>
                  +
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {previews.map((src, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <img src={src} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  <input type="text" placeholder={`Caption for photo ${i + 1} (optional)`}
                    value={captions[i] ?? ""}
                    onChange={(e) => { const next = [...captions]; next[i] = e.target.value; setCaptions(next); }}
                    className={inputClass} style={inputStyle} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Optional message */}
      <div className="warm-glass rounded-2xl p-5">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-3">Add a message (optional)</p>
        <textarea rows={3} placeholder="Write a short birthday message to go with the photos…"
          value={message} onChange={(e) => setMessage(e.target.value)}
          className={inputClass + " resize-none"} style={inputStyle} />
      </div>

      {saving && progress < 100 && (
        <div className="rounded-full overflow-hidden h-1.5" style={{ background: "rgba(212,160,23,0.1)" }}>
          <div className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg,#d4a017,#c8843a)" }} />
        </div>
      )}

      {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}

      <button type="submit" disabled={saving}
        className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}>
        {saving ? `Uploading… ${progress}%` : "Send Photos →"}
      </button>
    </form>
  );
}
