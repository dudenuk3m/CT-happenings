import React from "react";

export const SectionTitle = ({ t }: { t: string }) => (
  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#7a7060] mb-4 flex items-center gap-2">
    <div className="w-1 h-3 bg-[#e8b84b]" /> {t}
  </div>
);
