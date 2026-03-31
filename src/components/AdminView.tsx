import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Unlock, Plus, Check, X } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { ListItem } from "./ListItem";

export interface AdminViewProps {
  config: any;
  updateConfig: (c: any) => Promise<void>;
  showToast: (m: string) => void;
  userEmail: string | null;
}

export function AdminView({ config, updateConfig, showToast, userEmail }: AdminViewProps) {
  const [authed,       setAuthed]       = useState(false);
  const [pw,           setPw]           = useState("");
  const [local,        setLocal]        = useState(config);
  const [addHosp,      setAddHosp]      = useState(false);
  const [newHosp,      setNewHosp]      = useState("");
  const [addCat,       setAddCat]       = useState(false);
  const [newCatName,   setNewCatName]   = useState("");
  const [newCatColor,  setNewCatColor]  = useState("#0d9488");

  useEffect(() => { setLocal(config); }, [config]);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === config.password) { setAuthed(true); setPw(""); }
    else showToast("Incorrect password");
  };

  const save = async () => { await updateConfig(local); showToast("Configuration updated"); };

  const miniBtn = (bg: string, color: string, onClick: () => void, icon: React.ReactNode) => (
    <button 
      onClick={onClick} 
      className="p-2 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform active:scale-90"
      style={{ backgroundColor: bg, color }}
    >
      {icon}
    </button>
  );

  if (!authed) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-[#d6cfc4] rounded p-10 w-full max-w-[340px] text-center shadow-xl"
      >
        <div className="w-14 h-14 bg-[#1a1a2e] rounded-full flex items-center justify-center mx-auto mb-5 text-[#e8b84b] shadow-lg">
          <Lock size={26} />
        </div>
        <h2 className="text-xl font-bold mb-2">Admin Access</h2>
        <p className="text-xs text-[#7a7060] mb-6">Enter password to modify system settings.</p>
        <form onSubmit={login}>
          <input 
            type="password" 
            placeholder="••••" 
            value={pw} 
            onChange={e => setPw(e.target.value)}
            className="w-full p-3.5 bg-[#f9f7f4] border border-[#d6cfc4] rounded text-2xl text-center tracking-[0.5em] outline-none mb-4 focus:ring-2 focus:ring-[#e8b84b]/20" 
          />
          <button 
            type="submit" 
            className="w-full p-4 bg-[#1a1a2e] text-white text-base font-bold rounded border-b-4 border-[#e8b84b] shadow-md cursor-pointer hover:bg-[#252542] transition-colors"
          >
            Unlock
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Unlock size={20} className="text-[#059669]" /> Settings
        </h2>
        <button 
          onClick={save} 
          className="bg-[#1a1a2e] text-[#e8b84b] px-5 py-2.5 rounded font-bold text-xs tracking-wider uppercase shadow-md hover:bg-[#252542] transition-colors cursor-pointer"
        >
          Save Changes
        </button>
      </div>

      {/* Security */}
      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <SectionTitle t="Security" />
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-[#7a7060] font-bold uppercase tracking-wider">Admin Password</label>
          <input 
            type="text" 
            value={local.password} 
            onChange={e => setLocal((c: any) => ({ ...c, password: e.target.value }))} 
            className="w-full p-3 bg-[#f9f7f4] border border-[#d6cfc4] rounded text-sm outline-none focus:ring-2 focus:ring-[#e8b84b]/20" 
          />
        </div>
      </section>

      {/* Hospitals */}
      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <SectionTitle t={`Hospitals (${local.hospitals.length})`} />
          <button 
            onClick={() => setAddHosp(true)} 
            className="bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="max-h-[200px] overflow-y-auto pr-1">
          {local.hospitals.map((h: string) => (
            <ListItem key={h} label={h} onRemove={() => setLocal((c: any) => ({ ...c, hospitals: c.hospitals.filter((x: string) => x !== h) }))} />
          ))}
        </div>
        {addHosp && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded mt-3 shadow-inner"
          >
            <input 
              autoFocus 
              type="text" 
              placeholder="Hospital name…" 
              value={newHosp} 
              onChange={e => setNewHosp(e.target.value)}
              onKeyDown={e => { 
                if (e.key === "Enter") { 
                  const n = newHosp.trim(); 
                  if (n && !local.hospitals.includes(n)) { 
                    setLocal((c: any) => ({ ...c, hospitals: [...c.hospitals, n] })); 
                    setNewHosp(""); 
                    setAddHosp(false); 
                  }
                }
              }}
              className="flex-1 p-2.5 bg-white border border-blue-200 rounded text-sm outline-none" 
            />
            {miniBtn("#1a1a2e", "white", () => { 
              const n = newHosp.trim(); 
              if (n && !local.hospitals.includes(n)) { 
                setLocal((c: any) => ({ ...c, hospitals: [...c.hospitals, n] })); 
                setNewHosp(""); 
                setAddHosp(false); 
              }
            }, <Check size={16} />)}
            {miniBtn("#e5e7eb", "#374151", () => setAddHosp(false), <X size={16} />)}
          </motion.div>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white border border-[#d6cfc4] rounded p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <SectionTitle t={`Categories (${local.categories.length})`} />
          <button 
            onClick={() => setAddCat(true)} 
            className="bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="max-h-[200px] overflow-y-auto pr-1">
          {local.categories.map((c: any) => (
            <ListItem 
              key={c.name} 
              label={c.name} 
              dot={c.color} 
              onRemove={() => setLocal((lc: any) => ({ ...lc, categories: lc.categories.filter((x: any) => x.name !== c.name) }))} 
            />
          ))}
        </div>
        {addCat && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded mt-3 shadow-inner"
          >
            <input 
              autoFocus 
              type="text" 
              placeholder="Category name…" 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              className="w-full p-2.5 bg-white border border-blue-200 rounded text-sm outline-none" 
            />
            <div className="flex gap-2">
              <input 
                type="color" 
                value={newCatColor} 
                onChange={e => setNewCatColor(e.target.value)}
                className="w-10 h-10 p-1 bg-white border border-blue-200 rounded cursor-pointer" 
              />
              <input 
                type="text" 
                placeholder="#hex" 
                value={newCatColor} 
                onChange={e => setNewCatColor(e.target.value)} 
                className="flex-1 p-2.5 bg-white border border-blue-200 rounded text-sm outline-none" 
              />
              {miniBtn("#1a1a2e", "white", () => { 
                const n = newCatName.trim(); 
                if (n) { 
                  setLocal((c: any) => ({ ...c, categories: [...c.categories, { name: n, color: newCatColor }] })); 
                  setNewCatName(""); 
                  setAddCat(false); 
                }
              }, <Check size={16} />)}
              {miniBtn("#e5e7eb", "#374151", () => setAddCat(false), <X size={16} />)}
            </div>
          </motion.div>
        )}
      </section>

      <button 
        onClick={() => setAuthed(false)} 
        className="mt-4 p-4 text-[#7a7060] hover:text-[#1a1a2e] font-bold text-sm uppercase tracking-widest transition-colors cursor-pointer"
      >
        Lock Session
      </button>
    </div>
  );
}
