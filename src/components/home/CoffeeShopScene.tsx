"use client";

// Atmospheric SVG/CSS coffee shop background elements

export function PendantLight({ x, delay = 0 }: { x: number; delay?: number }) {
  return (
    <div
      className="absolute top-0 flex flex-col items-center pointer-events-none"
      style={{ left: `${x}%`, animationDelay: `${delay}s` }}
    >
      {/* Wire */}
      <div className="w-px h-16 bg-gradient-to-b from-stone-700/60 to-stone-600/40" />
      {/* Shade */}
      <div className="relative">
        <div
          className="w-10 h-6 rounded-b-full"
          style={{
            background: "linear-gradient(180deg, #3d2a10 0%, #2a1c08 100%)",
            boxShadow: "0 8px 30px rgba(212,160,23,0.25), 0 2px 8px rgba(0,0,0,0.8)",
            borderTop: "1px solid rgba(101,67,20,0.6)",
          }}
        />
        {/* Light cone */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderTop: "0",
            filter: "blur(8px)",
            background: "none",
            boxShadow: "0 10px 40px 20px rgba(212,160,23,0.12)",
          }}
        />
      </div>
    </div>
  );
}

export function CoffeeTableSurface() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
      style={{
        background: "linear-gradient(180deg, rgba(62,38,14,0) 0%, rgba(62,38,14,0.9) 40%, rgba(44,26,8,1) 100%)",
        borderTop: "1px solid rgba(101,67,20,0.4)",
      }}
    >
      {/* Wood grain lines */}
      {[15, 32, 58, 74, 88].map((x, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 opacity-20"
          style={{
            left: `${x}%`,
            width: "1px",
            background: "linear-gradient(180deg, transparent, rgba(101,67,20,0.6), transparent)",
          }}
        />
      ))}
    </div>
  );
}

export function FloatingParticle({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <div
      className="absolute w-0.5 h-0.5 rounded-full bg-amber-600/30 pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `float ${3 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export function BookshelfDecor({ side }: { side: "left" | "right" }) {
  const books = [
    { h: 80, w: 16, color: "#3d2010" },
    { h: 90, w: 12, color: "#4a2e18" },
    { h: 70, w: 14, color: "#2d1a0c" },
    { h: 85, w: 10, color: "#5a3820" },
    { h: 75, w: 18, color: "#3a2210" },
    { h: 95, w: 12, color: "#442a14" },
    { h: 65, w: 16, color: "#302010" },
  ];

  return (
    <div
      className={`absolute top-1/4 ${side === "left" ? "left-0" : "right-0"} h-48 flex items-end gap-0.5 opacity-40 pointer-events-none`}
      style={{ padding: "0 8px" }}
    >
      {books.map((book, i) => (
        <div
          key={i}
          style={{
            height: `${book.h}%`,
            width: `${book.w}px`,
            background: book.color,
            borderTop: "1px solid rgba(212,160,23,0.15)",
            borderLeft: "1px solid rgba(212,160,23,0.08)",
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );
}
