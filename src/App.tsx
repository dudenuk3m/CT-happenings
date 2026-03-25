/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BarRow } from "./components/BarRow";
import { SectionTitle } from "./components/SectionTitle";
import { ListItem } from "./components/ListItem";
import { EntryView } from "./components/EntryView";
import { OverviewView } from "./components/OverviewView";
import { AdminView } from "./components/AdminView";
import {
  Settings, LogOut, ClipboardList, PieChart, CheckCircle, MapPin, LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc,
  getDocFromServer,
  Timestamp
} from "firebase/firestore";
import { 
  onAuthStateChanged, 
  signOut,
  User,
  signInAnonymously
} from "firebase/auth";
import { db, auth } from "./firebase";

// ─── Firebase Error Handling ────────────────────────────────────────────────
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─── Palette & Constants ────────────────────────────────────────────────────
const C = {
  ink:   "#0f0f0f",
  paper: "#f5f0eb",
  rule:  "#d6cfc4",
  navy:  "#1a1a2e",
  gold:  "#e8b84b",
  muted: "#7a7060",
  white: "#ffffff",
  red:   "#dc2626",
};

const DEFAULT_CONFIG = {
  password: "et",
  hospitals: ["General Hospital", "City Medical Center", "Westside Clinic", "St. Judes"],
  categories: [
    { name: "Operations",    color: "#2563eb" },
    { name: "Protocols",     color: "#7c3aed" },
    { name: "Complaints",    color: "#dc2626" },
    { name: "Opportunities", color: "#059669" },
    { name: "Intel",         color: "#d97706" },
    { name: "Random",        color: "#475569" },
  ],
};

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [msg, onClose]);
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed top-20 left-1/2 z-[999] bg-zinc-900 text-white px-5 py-2.5 rounded shadow-2xl flex items-center gap-2 border-l-4 border-[#e8b84b] whitespace-nowrap text-sm font-medium"
        >
          <CheckCircle size={16} className="text-[#e8b84b]" />
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 px-5 py-2 transition-colors ${active ? 'text-[#e8b84b]' : 'text-white/40 hover:text-white/60'}`}
    >
      {icon}
      <span className="text-[9px] font-bold tracking-[0.15em] uppercase">{label}</span>
    </button>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check for existing guest ID or create new one
    let guestId = localStorage.getItem("ct_guest_id");
    if (!guestId) {
      guestId = "guest-" + Math.random().toString(36).substring(7);
      localStorage.setItem("ct_guest_id", guestId);
    }
    
    // Check if user is already logged in via Firebase (e.g. from previous Google session)
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email });
      } else {
        setUser({ uid: guestId!, email: null });
      }
      setIsAuthReady(true);
    });
    
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#e8b84b] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#7a7060] text-sm font-medium tracking-widest uppercase">Initializing</span>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#e8b84b] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#7a7060] text-sm font-medium tracking-widest uppercase">Signing In</span>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <MainApp user={user} />
    </ErrorBoundary>
  );
}

function MainApp({ user }: { user: { uid: string; email: string | null } }) {
  const [logs,   setLogs]   = useState<any[]>([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [tab,    setTab]    = useState("entry");
  const [toast,  setToast]  = useState("");
  const [ready,  setReady]  = useState(false);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const isUserAdmin = true; // Allow anyone to try admin login with password

  // Real-time Config
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "global"), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as any);
      } else {
        // Initialize config if it doesn't exist (only if admin)
        if (isUserAdmin) {
          setDoc(doc(db, "config", "global"), DEFAULT_CONFIG).catch(err => {
            console.error("Failed to initialize config:", err);
          });
        }
      }
    }, (error) => {
      // Silently fail or handle if needed
    });
    return () => unsubscribe();
  }, [isUserAdmin]);

  // Real-time Logs
  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setLogs(newLogs);
      setReady(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "logs", user.uid);
    });
    return () => unsubscribe();
  }, []);

  const addLog = useCallback(async (entry: any) => {
    try {
      await addDoc(collection(db, "logs"), {
        ...entry,
        authorUid: user.uid,
        timestamp: Timestamp.now().toMillis()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "logs", user.uid);
    }
  }, [user]);

  const deleteLog = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "logs", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `logs/${id}`, user.uid);
    }
  }, [user]);

  const updateConfig = useCallback(async (next: any) => {
    try {
      await setDoc(doc(db, "config", "global"), next);
      setConfig(next);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "config/global", user.uid);
    }
  }, [user]);

  const showToast    = useCallback((m: string) => setToast(m), []);

  const labels: Record<string, string> = { entry: "New Entry", overview: "Overview", admin: "Administration" };

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#e8b84b] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#7a7060] text-sm font-medium tracking-widest uppercase">Syncing Data</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* Header */}
      <header className="bg-[#1a1a2e] px-5 py-4 flex justify-between items-baseline sticky top-0 z-30 border-b-4 border-[#e8b84b] shadow-lg">
        <h1 className="text-xl font-bold text-white">{labels[tab]}</h1>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#e8b84b]">CT Happenings</span>
            <button onClick={() => signOut(auth)} className="text-white/40 hover:text-white/60 transition-colors">
              <LogOut size={12} />
            </button>
          </div>
          <span className="text-[8px] font-medium text-white/40 uppercase tracking-tighter">Field Operations Log</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "entry"    && <EntryView    config={config} addLog={addLog}             showToast={showToast} />}
            {tab === "overview" && <OverviewView logs={logs}     config={config}              showToast={showToast} deleteLog={deleteLog} />}
            {tab === "admin"    && <AdminView    config={config} updateConfig={updateConfig}  showToast={showToast} userEmail={user.email} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t-4 border-[#e8b84b] flex justify-around pt-2 pb-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <NavItem icon={<ClipboardList size={22} />} label="Log"      active={tab === "entry"}    onClick={() => setTab("entry")} />
        <NavItem icon={<PieChart size={22} />}      label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
        <NavItem icon={<Settings size={22} />}      label="Admin"    active={tab === "admin"}    onClick={() => setTab("admin")} />
      </nav>
    </div>
  );
}

// ─── End of App ─────────────────────────────────────────────────────────────
