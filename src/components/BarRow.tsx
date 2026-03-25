import React from "react";
import { motion } from "motion/react";

export interface BarRowProps {
  name: string;
  count: number;
  max: number;
  color: string;
  filter: string;
  setFilter: (s: string) => void;
}

export function BarRow({ name, count, max, color, filter, setFilter }: BarRowProps) {
  const sel = filter === name;
  const dim = filter !== "All" && !sel;
  return (
    <div 
      onClick={() => setFilter(sel ? "All" : name)} 
      className={`flex items-center gap-2 mb-1.5 cursor-pointer transition-opacity duration-200 ${dim ? 'opacity-30' : 'opacity-100'}`}
    >
      <div className="w-[70px] text-[11px] font-medium text-right text-white overflow-hidden text-ellipsis whitespace-nowrap flex-shrink-0">{name}</div>
      <div className="flex-1 h-3.5 bg-white/10 rounded-sm overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(count / max) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: color }} 
        />
      </div>
      <div className="w-[18px] text-[11px] font-bold text-white/60 text-right flex-shrink-0">{count}</div>
    </div>
  );
}
