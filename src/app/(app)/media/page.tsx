"use client";

import { useState, useRef } from "react";
import { Image, FileText, Music, Video, Upload, Plus, Trash2, Eye } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  type: "image" | "audio" | "video" | "document";
  size: string;
  url: string;
  addedAt: string;
  caption: string;
}

const TYPE_ICONS = {
  image: <Image size={20} />,
  audio: <Music size={20} />,
  video: <Video size={20} />,
  document: <FileText size={20} />,
};

const TYPE_COLORS = {
  image: "#3a8a4a",
  audio: "#2a7a8a",
  video: "#8a5c8a",
  document: "#c8843a",
};

function getMediaType(file: File): MediaItem["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<MediaItem["type"] | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const newItems: MediaItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type: getMediaType(file),
      size: formatSize(file.size),
      url: URL.createObjectURL(file),
      addedAt: new Date().toISOString(),
      caption: "",
    }));
    setItems((prev) => [...newItems, ...prev]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const counts = {
    all: items.length,
    image: items.filter((i) => i.type === "image").length,
    audio: items.filter((i) => i.type === "audio").length,
    video: items.filter((i) => i.type === "video").length,
    document: items.filter((i) => i.type === "document").length,
  };

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Story</div>
          <h1 className="text-amber-200 font-serif font-bold text-3xl">Media Library</h1>
          <p className="text-amber-700/50 font-sans text-sm mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} · Photos, audio, video & documents
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-serif font-semibold text-sm text-amber-50 transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)", boxShadow: "0 4px 16px rgba(100,60,15,0.3)" }}>
          <Plus size={15} />
          Add Media
        </button>
        <input ref={fileRef} type="file" multiple className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {/* Drop zone (only shown when empty) */}
      {items.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6"
          style={{
            borderColor: dragging ? "rgba(200,130,60,0.6)" : "rgba(90,52,20,0.3)",
            background: dragging ? "rgba(120,70,20,0.1)" : "rgba(15,10,4,0.3)",
          }}>
          <Upload size={32} className="text-amber-700/30 mx-auto mb-3" />
          <p className="text-amber-700/60 font-serif italic text-sm mb-1">
            Drop photos, audio recordings, videos, or documents here
          </p>
          <p className="text-amber-800/40 text-xs font-sans">
            Or click to browse · Images, audio, video, PDF, Word docs
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
            style={{ background: "rgba(15,10,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
            {(["all", "image", "audio", "video", "document"] as const).map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all capitalize"
                style={{
                  background: filter === t ? "rgba(120,70,18,0.5)" : "transparent",
                  color: filter === t ? "rgba(240,200,120,0.9)" : "rgba(140,90,30,0.6)",
                }}>
                {t === "image" && <Image size={11} />}
                {t === "audio" && <Music size={11} />}
                {t === "video" && <Video size={11} />}
                {t === "document" && <FileText size={11} />}
                {t} ({counts[t]})
              </button>
            ))}
          </div>

          {/* Drop zone at top when has content */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="rounded-xl py-2.5 text-center mb-4 transition-all cursor-pointer border border-dashed"
            onClick={() => fileRef.current?.click()}
            style={{
              borderColor: dragging ? "rgba(200,130,60,0.5)" : "rgba(90,52,20,0.2)",
              background: dragging ? "rgba(120,70,20,0.08)" : "transparent",
            }}>
            <p className="text-amber-800/40 text-xs font-sans flex items-center justify-center gap-2">
              <Upload size={11} />
              Drop more files here or click to add
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((item) => {
              const color = TYPE_COLORS[item.type];
              return (
                <div key={item.id}
                  className="group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(18,11,4,0.7)", borderColor: `${color}25` }}
                  onClick={() => setSelected(item)}>
                  {/* Preview */}
                  <div className="aspect-square flex items-center justify-center overflow-hidden relative"
                    style={{ background: `${color}10` }}>
                    {item.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === "audio" ? (
                      <div className="flex flex-col items-center gap-2">
                        <Music size={28} style={{ color: `${color}80` }} />
                        <div className="flex gap-0.5 items-end">
                          {Array.from({ length: 8 }, (_, i) => (
                            <div key={i} className="w-1 rounded-full"
                              style={{ height: `${4 + Math.sin(i) * 12 + 8}px`, background: `${color}50` }} />
                          ))}
                        </div>
                      </div>
                    ) : item.type === "video" ? (
                      <Video size={32} style={{ color: `${color}70` }} />
                    ) : (
                      <FileText size={32} style={{ color: `${color}70` }} />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.4)" }}>
                      <Eye size={18} className="text-white/70" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-3 py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-sans text-amber-300/80 truncate">{item.name}</div>
                      <div className="text-[9px] font-sans text-amber-800/40 mt-0.5">{item.size}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                        if (selected?.id === item.id) setSelected(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-amber-800/40 hover:text-red-500/60 transition-all flex-shrink-0 p-0.5">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal viewer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,3,1,0.9)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelected(null)}>
          <div className="relative max-w-3xl w-full max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ background: "rgba(18,11,4,0.95)", border: "1px solid rgba(90,52,20,0.4)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-amber-900/20 flex items-center justify-between">
              <div>
                <div className="text-sm font-serif text-amber-200 font-semibold">{selected.name}</div>
                <div className="text-[9px] font-sans text-amber-800/40">{selected.size} · {selected.type}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-amber-700/60 hover:text-amber-400 transition-colors p-1">✕</button>
            </div>
            <div className="p-4 flex items-center justify-center" style={{ minHeight: "300px" }}>
              {selected.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.url} alt={selected.name} className="max-w-full max-h-[50vh] object-contain rounded-xl" />
              )}
              {selected.type === "audio" && (
                <audio controls src={selected.url} className="w-full max-w-md" />
              )}
              {selected.type === "video" && (
                <video controls src={selected.url} className="max-w-full max-h-[50vh] rounded-xl" />
              )}
              {selected.type === "document" && (
                <div className="text-center">
                  <FileText size={48} className="text-amber-700/40 mx-auto mb-3" />
                  <p className="text-amber-700/60 text-sm font-serif">{selected.name}</p>
                  <a href={selected.url} download={selected.name}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-xs font-sans text-amber-200 transition-all hover:scale-105"
                    style={{ background: "rgba(100,60,18,0.6)" }}>
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
