import React from "react";
import { X } from "lucide-react";

export interface ListItemProps {
  label: string;
  dot?: string;
  onRemove: () => void;
}

export const ListItem = ({ label, dot, onRemove }: ListItemProps) => (
  <div className="flex justify-between items-center p-3 bg-[#f9f7f4] border border-[#d6cfc4] rounded mb-2 group">
    <div className="flex items-center gap-3">
      {dot && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: dot }} />}
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
    </div>
    <button 
      onClick={onRemove} 
      className="text-[#dc2626] opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer"
    >
      <X size={16} />
    </button>
  </div>
);
