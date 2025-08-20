"use client";

import { useEffect, useState } from "react";

export function BrandLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      // 0 -> 95% 까지 1.2초에 도달하도록
      const next = Math.min(95, Math.floor((elapsed / 1200) * 95));
      setProgress(next);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 section-gray flex items-center justify-center z-[9999]">
      <div className="text-center animate-fade-in">
        <img src="/logo_faddit.svg" alt="Faddit" className="h-10 mx-auto mb-5" />
        <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto shadow-inner">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}


