import React, { useState, useEffect } from "react";
import { MapPin, Tag, FileText } from "lucide-react";

export interface EntryViewProps {
  config: any;
  addLog: (e: any) => Promise<void>;
  showToast: (m: string) => void;
}

export function EntryView({ config, addLog, showToast }: EntryViewProps) {
  const [hospital, setHospital] = useState(config.hospitals[0] || "");
  const [category, setCategory] = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { if (!hospital && config.hospitals[0]) setHospital(config.hospitals[0]); }, [config.hospitals, hospital]);

  const submit = async () => {
    if (!hospital || !category || !notes.trim()) { showToast("Please fill all fields"); return; }
    setSaving(true);
    const now = new Date();
    await addLog({
      hospital, 
      category, 
      notes,
      dateString: now.toLocaleString("en-SG", { timeZone: "Asia/Singapore", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
    });
    showToast("Entry saved");
    setCategory(""); setNotes(""); setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#7a7060] mb-3 block flex items-center gap-2">
          <MapPin size={12} /> Hospital Site
        </label>
        <select 
          value={hospital} 
          onChange={e => setHospital(e.target.value)} 
          className="w-full p-3.5 bg-white border border-[#d6cfc4] rounded font-medium text-base outline-none focus:ring-2 focus:ring-[#e8b84b]/20 transition-all appearance-none cursor-pointer"
        >
          {config.hospitals.map((h: string) => <option key={h}>{h}</option>)}
        </select>
      </section>

      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#7a7060] mb-3 block flex items-center gap-2">
          <Tag size={12} /> Category
        </label>
        <div className="grid grid-cols-2 gap-3">
          {config.categories.map((cat: any) => {
            const sel = category === cat.name;
            return (
              <button 
                key={cat.name} 
                onClick={() => setCategory(cat.name)} 
                className={`p-3.5 border rounded font-semibold text-sm transition-all text-left flex items-center gap-3 ${
                  sel ? 'border-transparent text-white' : 'border-[#d6cfc4] bg-white text-[#0f0f0f] hover:bg-zinc-50'
                }`}
                style={{ backgroundColor: sel ? cat.color : undefined }}
              >
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: sel ? "rgba(255,255,255,0.6)" : cat.color }} 
                />
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#7a7060] mb-3 block flex items-center gap-2">
          <FileText size={12} /> Details
        </label>
        <textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          placeholder="Observations, intel, or notes…"
          className="w-full min-h-[160px] p-4 bg-white border border-[#d6cfc4] rounded text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#e8b84b]/20 transition-all resize-none" 
        />
      </section>

      <button 
        onClick={submit} 
        disabled={saving} 
        className={`w-full p-5 bg-[#1a1a2e] text-white text-lg font-bold rounded border-b-4 border-[#e8b84b] shadow-lg transition-all active:translate-y-1 active:border-b-0 ${
          saving ? "opacity-60 cursor-not-allowed" : "hover:bg-[#252542] cursor-pointer"
        }`}
      >
        {saving ? "Processing…" : "Submit Entry"}
      </button>
    </div>
  );
}
