import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Search, Download, Share, FileText, MapPin, Calendar, Pencil, Check, X } from "lucide-react";
import { BarRow } from "./BarRow";

export interface OverviewViewProps {
  logs: any[];
  config: any;
  showToast: (m: string) => void;
  deleteLog: (id: string) => Promise<void>;
  updateLog: (id: string, entry: any) => Promise<void>;
}

export function OverviewView({ logs, config, showToast, deleteLog, updateLog }: OverviewViewProps) {
  const [query,        setQuery]        = useState("");
  const [filterCat,    setFilterCat]    = useState("All");
  const [filterHosp,   setFilterHosp]   = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<any>(null); 
  const [deletePw,     setDeletePw]     = useState("");
  const [editTarget,   setEditTarget]   = useState<any>(null);
  const [editPw,       setEditPw]       = useState("");
  const [isEditing,    setIsEditing]    = useState(false);
  const [pwError,      setPwError]      = useState(false);
  const [editData,     setEditData]     = useState<any>(null);
  const [reassignTarget, setReassignTarget] = useState<any>(null);
  const [reassignPw,   setReassignPw]   = useState("");

  const openDeleteModal  = (log: any) => { setDeleteTarget(log); setDeletePw(""); setPwError(false); };
  const closeDeleteModal = ()    => { setDeleteTarget(null); setDeletePw(""); setPwError(false); };

  const openEditModal = (log: any) => { 
    setEditTarget(log); 
    setEditPw(""); 
    setPwError(false); 
    setIsEditing(false);
    setEditData({ ...log });
  };
  const closeEditModal = () => { setEditTarget(null); setEditPw(""); setPwError(false); setIsEditing(false); setEditData(null); };

  const openReassignModal = (log: any) => {
    setReassignTarget(log);
    setReassignPw("");
    setPwError(false);
    setIsEditing(false);
  };
  const closeReassignModal = () => { setReassignTarget(null); setReassignPw(""); setPwError(false); setIsEditing(false); };

  const confirmDelete = () => {
    if (deletePw === config.password) {
      deleteLog(deleteTarget.id);
      showToast("Entry deleted");
      closeDeleteModal();
    } else {
      setPwError(true);
      setDeletePw("");
    }
  };

  const confirmEditPw = () => {
    if (editPw === config.password) {
      setIsEditing(true);
      setPwError(false);
    } else {
      setPwError(true);
      setEditPw("");
    }
  };

  const confirmReassignPw = () => {
    if (reassignPw === config.password) {
      setIsEditing(true);
      setPwError(false);
    } else {
      setPwError(true);
      setReassignPw("");
    }
  };

  const saveEdit = async () => {
    if (!editData.notes.trim()) return showToast("Notes cannot be empty");
    await updateLog(editTarget.id, editData);
    showToast("Entry updated");
    closeEditModal();
  };

  const quickReassign = async (newCat: string) => {
    await updateLog(reassignTarget.id, { ...reassignTarget, category: newCat });
    showToast(`Reassigned to ${newCat}`);
    closeReassignModal();
  };

  const catColor = (name: string) => config.categories.find((c: any) => c.name === name)?.color || "#475569";

  const catStats = useMemo(() => {
    const m: Record<string, any> = {}; 
    config.categories.forEach((c: any) => { m[c.name] = { count: 0, color: c.color }; });
    logs.forEach(l => { if ((filterHosp === "All" || l.hospital === filterHosp) && m[l.category]) m[l.category].count++; });
    return Object.entries(m).map(([name, d]) => ({ name, ...d })).sort((a,b) => b.count - a.count);
  }, [logs, config, filterHosp]);

  const hospStats = useMemo(() => {
    const m: Record<string, number> = {}; 
    config.hospitals.forEach((h: string) => { m[h] = 0; });
    logs.forEach(l => { if (filterCat === "All" || l.category === filterCat) m[l.hospital] = (m[l.hospital] || 0) + 1; });
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [logs, config, filterCat]);

  const maxCat  = Math.max(...catStats.map(s => s.count),  1);
  const maxHosp = Math.max(...hospStats.map(s => s.count), 1);

  const filtered = useMemo(() => logs.filter(l => {
    const q = query.toLowerCase();
    return (l.hospital.toLowerCase().includes(q) || l.notes.toLowerCase().includes(q))
      && (filterCat  === "All" || l.category === filterCat)
      && (filterHosp === "All" || l.hospital === filterHosp);
  }), [logs, query, filterCat, filterHosp]);

  const handleShare = async (log: any) => {
    const text = `[${log.category}] ${log.hospital}\n${log.notes}\n${log.dateString || ""}`;
    if (navigator.share) { try { await navigator.share({ title: "Site Log", text }); } catch {} }
    else { navigator.clipboard.writeText(text); showToast("Copied to clipboard"); }
  };

  const exportPDF = () => {
    if (!filtered.length) { showToast("No logs to export"); return; }
    const title   = filterHosp !== "All" ? filterHosp : (query || "All Sites");
    const nowSGT  = new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "long" });
    const win     = window.open("", "", "height=800,width=800");
    if (!win) return;
    let html = `<html><head><title>Export – ${title}</title><style>
      body{font-family:system-ui;padding:40px;color:#222;background:#f5f0eb}
      h1{border-bottom:3px solid #e8b84b;padding-bottom:10px}
      .log{border:1px solid #d6cfc4;background:#fff;margin-bottom:18px;padding:16px;border-radius:3px;page-break-inside:avoid}
      .meta{font-size:.82em;color:#666;display:flex;justify-content:space-between;margin-bottom:8px}
      .badge{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:2px;color:#fff}
      .notes{margin-top:10px;line-height:1.6;white-space:pre-wrap}
    </style></head><body>
    <h1>Activity Report: ${title}</h1>
    <p style="color:#666;font-size:13px">Generated: ${nowSGT} · ${filtered.length} entries</p><hr/>`;
    filtered.forEach(l => {
      const color = catColor(l.category);
      html += `<div class="log" style="border-left:4px solid ${color}">
        <div class="meta"><strong>${l.hospital}</strong><span>${l.dateString || ""}</span></div>
        <span class="badge" style="background:${color}">${l.category}</span>
        <div class="notes">${l.notes}</div>
      </div>`;
    });
    html += "</body></html>";
    win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 250);
  };

  return (
    <div className="flex flex-col">
      {/* Delete password modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-6" 
            onClick={closeDeleteModal}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white rounded p-7 w-full max-w-[320px] border-t-4 border-[#dc2626] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-[#dc2626]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f0f0f]">Delete Entry</h3>
                  <p className="text-xs text-[#7a7060] mt-0.5">Enter password to confirm</p>
                </div>
              </div>

              <div className="bg-[#f9f7f4] border border-[#d6cfc4] rounded p-3 mb-4">
                <div 
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: catColor(deleteTarget.category) }}
                >
                  {deleteTarget.category}
                </div>
                <div className="text-sm font-semibold text-[#0f0f0f]">{deleteTarget.hospital}</div>
                <div className="text-xs text-[#7a7060] mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {deleteTarget.notes}
                </div>
              </div>

              <input
                autoFocus
                type="password"
                placeholder="Password"
                value={deletePw}
                onChange={e => { setDeletePw(e.target.value); setPwError(false); }}
                onKeyDown={e => e.key === "Enter" && confirmDelete()}
                className={`w-full p-3 bg-[#f9f7f4] border rounded font-sans text-sm text-center tracking-[0.3em] outline-none mb-2 ${
                  pwError ? 'border-[#dc2626] bg-red-50' : 'border-[#d6cfc4]'
                }`}
              />
              {pwError && (
                <div className="text-[11px] text-[#dc2626] font-semibold text-center mb-3">
                  Incorrect password
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={closeDeleteModal} 
                  className="flex-1 p-2.5 bg-zinc-100 text-zinc-700 rounded font-semibold text-sm cursor-pointer hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 p-2.5 bg-[#dc2626] text-white rounded font-bold text-sm cursor-pointer hover:bg-red-700 transition-colors shadow-md"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-6" 
            onClick={closeEditModal}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white rounded p-7 w-full max-w-[400px] border-t-4 border-[#e8b84b] shadow-2xl"
            >
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Pencil size={18} className="text-[#e8b84b]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0f0f0f]">Edit Entry</h3>
                      <p className="text-xs text-[#7a7060] mt-0.5">Enter password to unlock</p>
                    </div>
                  </div>

                  <input
                    autoFocus
                    type="password"
                    placeholder="Password"
                    value={editPw}
                    onChange={e => { setEditPw(e.target.value); setPwError(false); }}
                    onKeyDown={e => e.key === "Enter" && confirmEditPw()}
                    className={`w-full p-3 bg-[#f9f7f4] border rounded font-sans text-sm text-center tracking-[0.3em] outline-none mb-2 ${
                      pwError ? 'border-[#dc2626] bg-red-50' : 'border-[#d6cfc4]'
                    }`}
                  />
                  {pwError && (
                    <div className="text-[11px] text-[#dc2626] font-semibold text-center mb-3">
                      Incorrect password
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={closeEditModal} 
                      className="flex-1 p-2.5 bg-zinc-100 text-zinc-700 rounded font-semibold text-sm cursor-pointer hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmEditPw} 
                      className="flex-1 p-2.5 bg-[#e8b84b] text-[#1a1a2e] rounded font-bold text-sm cursor-pointer hover:bg-[#f0c970] transition-colors shadow-md"
                    >
                      Unlock
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0f0f0f]">Edit Details</h3>
                    <button onClick={closeEditModal} className="text-zinc-400 hover:text-zinc-600">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#7a7060] block mb-1">Site</label>
                      <select 
                        value={editData.hospital}
                        onChange={e => setEditData({ ...editData, hospital: e.target.value })}
                        className="w-full p-2.5 bg-[#f9f7f4] border border-[#d6cfc4] rounded text-sm outline-none"
                      >
                        {config.hospitals.map((h: string) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#7a7060] block mb-1">Category</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {config.categories.map((c: any) => (
                          <button
                            key={c.name}
                            onClick={() => setEditData({ ...editData, category: c.name })}
                            className={`p-2 text-[10px] font-bold rounded border transition-all ${
                              editData.category === c.name 
                                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' 
                                : 'bg-white text-[#7a7060] border-[#d6cfc4] hover:bg-zinc-50'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#7a7060] block mb-1">Notes</label>
                      <textarea 
                        value={editData.notes}
                        onChange={e => setEditData({ ...editData, notes: e.target.value })}
                        rows={4}
                        className="w-full p-2.5 bg-[#f9f7f4] border border-[#d6cfc4] rounded text-sm outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={closeEditModal} 
                      className="flex-1 p-2.5 bg-zinc-100 text-zinc-700 rounded font-semibold text-sm cursor-pointer hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveEdit} 
                      className="flex-1 p-2.5 bg-[#1a1a2e] text-white rounded font-bold text-sm cursor-pointer hover:bg-zinc-800 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Save Changes
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {reassignTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-6" 
            onClick={closeReassignModal}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white rounded p-7 w-full max-w-[340px] border-t-4 border-[#e8b84b] shadow-2xl"
            >
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Share size={18} className="text-[#e8b84b] rotate-90" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0f0f0f]">Reassign Category</h3>
                      <p className="text-xs text-[#7a7060] mt-0.5">Enter password to unlock</p>
                    </div>
                  </div>

                  <input
                    autoFocus
                    type="password"
                    placeholder="Password"
                    value={reassignPw}
                    onChange={e => { setReassignPw(e.target.value); setPwError(false); }}
                    onKeyDown={e => e.key === "Enter" && confirmReassignPw()}
                    className={`w-full p-3 bg-[#f9f7f4] border rounded font-sans text-sm text-center tracking-[0.3em] outline-none mb-2 ${
                      pwError ? 'border-[#dc2626] bg-red-50' : 'border-[#d6cfc4]'
                    }`}
                  />
                  {pwError && (
                    <div className="text-[11px] text-[#dc2626] font-semibold text-center mb-3">
                      Incorrect password
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={closeReassignModal} 
                      className="flex-1 p-2.5 bg-zinc-100 text-zinc-700 rounded font-semibold text-sm cursor-pointer hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmReassignPw} 
                      className="flex-1 p-2.5 bg-[#e8b84b] text-[#1a1a2e] rounded font-bold text-sm cursor-pointer hover:bg-[#f0c970] transition-colors shadow-md"
                    >
                      Unlock
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0f0f0f]">Select New Category</h3>
                    <button onClick={closeReassignModal} className="text-zinc-400 hover:text-zinc-600">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="bg-[#f9f7f4] border border-[#d6cfc4] rounded p-3 mb-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#7a7060] mb-1">Current</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor(reassignTarget.category) }} />
                      <span className="text-sm font-semibold">{reassignTarget.category}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {config.categories.map((c: any) => (
                      <button
                        key={c.name}
                        onClick={() => quickReassign(c.name)}
                        className={`p-3 text-xs font-bold rounded border transition-all flex items-center gap-2 ${
                          reassignTarget.category === c.name 
                            ? 'bg-[#1a1a2e] text-white border-[#1a1a2e] opacity-50 cursor-not-allowed' 
                            : 'bg-white text-[#0f0f0f] border-[#d6cfc4] hover:bg-zinc-50'
                        }`}
                        disabled={reassignTarget.category === c.name}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={closeReassignModal} 
                    className="w-full p-2.5 bg-zinc-100 text-zinc-700 rounded font-semibold text-sm cursor-pointer hover:bg-zinc-200 transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Export */}
      <div className="bg-[#1a1a2e] p-3.5 flex gap-2 sticky top-[60px] z-20 border-b border-white/10 shadow-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text" 
            placeholder="Search entries…" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/15 rounded text-white text-sm outline-none focus:ring-1 focus:ring-[#e8b84b]/50 transition-all"
          />
        </div>
        <button 
          onClick={exportPDF} 
          className="flex items-center gap-2 px-4 py-2 bg-[#e8b84b] text-[#1a1a2e] text-xs font-bold tracking-wider rounded shadow-md hover:bg-[#f0c970] transition-colors whitespace-nowrap"
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className="flex-1 pb-10">
        {/* Stats Dashboard */}
        {logs.length > 0 && (
          <div className="bg-[#1a1a2e] p-4 grid grid-cols-2 gap-6 border-b border-[#d6cfc4] shadow-inner">
            <section>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/50">By Category</h4>
                {filterCat !== "All" && (
                  <button 
                    onClick={() => setFilterCat("All")} 
                    className="text-[9px] font-bold text-[#e8b84b] bg-[#e8b84b]/15 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {catStats.map(s => <BarRow key={s.name} name={s.name} count={s.count} max={maxCat} color={s.color} filter={filterCat} setFilter={setFilterCat} />)}
            </section>
            <section>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/50">By Site</h4>
                {filterHosp !== "All" && (
                  <button 
                    onClick={() => setFilterHosp("All")} 
                    className="text-[9px] font-bold text-[#e8b84b] bg-[#e8b84b]/15 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {hospStats.filter(s => s.count > 0 || filterHosp === s.name).map(s =>
                <BarRow key={s.name} name={s.name} count={s.count} max={maxHosp} color="rgba(255,255,255,0.55)" filter={filterHosp} setFilter={setFilterHosp} />
              )}
            </section>
          </div>
        )}

        {/* Log Feed */}
        <div className="p-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#7a7060]">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No activity records found.</p>
            </div>
          ) : (
            filtered.map(log => {
              const color = catColor(log.category);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={log.id} 
                  className="bg-white border border-[#d6cfc4] border-l-4 rounded p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: color }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <button 
                      onClick={() => openReassignModal(log)}
                      className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white rounded hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: color }}
                    >
                      {log.category}
                    </button>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleShare(log)} 
                        className="p-1.5 text-[#7a7060] hover:text-[#1a1a2e] transition-colors"
                      >
                        <Share size={16} />
                      </button>
                      <button 
                        onClick={() => openEditModal(log)} 
                        className="p-1.5 text-[#7a7060] hover:text-[#e8b84b] transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(log)} 
                        className="p-1.5 text-[#7a7060] hover:text-[#dc2626] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0f0f0f] mb-1 flex items-center gap-2">
                    <MapPin size={14} className="text-[#7a7060]" /> {log.hospital}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap mb-4">{log.notes}</p>
                  <div className="text-[10px] text-[#7a7060] font-medium border-t border-[#d6cfc4] pt-3 flex items-center gap-1.5">
                    <Calendar size={12} /> {log.dateString}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
