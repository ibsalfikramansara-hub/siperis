import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { seedUsers, seedKelas, seedKategori, seedPengajuan, seedPengumuman } from "../data/seed";

const Ctx = createContext(null);
const KEY = "perizinan_app_v2";
const TOKEN_KEY = "perizinan_token";
const PENG_KEY = "perizinan_pengumuman";

const isNetErr = (e) => e instanceof TypeError; // fetch gagal total (server mati / offline)
const authHeaders = () => {
  const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
};
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
  return null;
}
function saveState(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
const normSettings = (s) => ({ ...s, idleTimeoutMenit: Number(s?.idleTimeoutMenit ?? 30), batasTerlambatMenit: Number(s?.batasTerlambatMenit ?? 15), jam_masuk: s?.jam_masuk || "06:30", jam_pulang: s?.jam_pulang || "16:00" });

export function AppProvider({children}) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("perizinan_user")||"null") } catch { return null } });
  const [users, setUsers] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [pengajuan, setPengajuan] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [pengumuman, setPengumuman] = useState(seedPengumuman);
  const [online, setOnline] = useState(false); // true = server sebagai sumber kebenaran
  const [settings, setSettings] = useState({ idleTimeoutMenit: 30, batasTerlambatMenit: 15, jam_masuk: "06:30", jam_pulang: "16:00" });
  const [wasOffline, setWasOffline] = useState(false);

  // Gabungkan pengajuan lokal (offline) dengan server, server prioritas tapi jaga entri lokal-only
  const mergePengajuan = useCallback((serverList, localList) => {
    const byId = new Map();
    (localList || []).forEach(x => byId.set(x.id, x));
    (serverList || []).forEach(x => byId.set(x.id, x)); // server menimpa lokal jika id sama
    return Array.from(byId.values());
  }, []);

  // Sesi habis / token tidak valid → bersihkan & paksa login ulang
  const handle401 = useCallback((showAlert = false) => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("perizinan_user");
    setUser(null);
    if (showAlert) alert("Sesi Anda telah berakhir. Silakan login kembali.");
  }, []);

  const logout = useCallback(() => {
    const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (t) fetch('/api/logout', { method:'POST', headers: authHeaders() }).catch(()=>{});
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("perizinan_user");
    setUser(null);
  }, []);

  // ---------- Idle auto-logout ----------
  const idleTimerRef = useRef(null);
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!user || !settings.idleTimeoutMenit) return;
    idleTimerRef.current = setTimeout(() => {
      logout();
      alert("Sesi habis karena tidak ada aktivitas selama " + settings.idleTimeoutMenit + " menit. Silakan login kembali.");
    }, settings.idleTimeoutMenit * 60 * 1000);
  }, [user, settings.idleTimeoutMenit, logout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown','mousemove','keypress','scroll','touchstart','click'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer));
    resetIdleTimer();
    return () => { events.forEach(ev => window.removeEventListener(ev, resetIdleTimer)); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [user, resetIdleTimer]);

  const applyState = useCallback((s, mergeLocal = false) => {
    setUsers(s.users || []);
    setKelas(s.kelas || []);
    setKategori(s.kategori || []);
    if (mergeLocal) {
      setPengajuan(prev => mergePengajuan(s.pengajuan || [], prev));
    } else {
      setPengajuan(s.pengajuan || []);
    }
    setAuditTrail(s.auditTrail || []);
    setPengumuman(s.pengumuman || seedPengumuman);
    setSettings(normSettings(s.settings));
  }, [mergePengajuan]);

  const fetchState = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const r = await fetch('/api/state', { headers: authHeaders() });
      if (r.status === 401) { handle401(false); return false; }
      if (!r.ok) return false;
      const data = await r.json();
      applyState(data, wasOffline);
      setOnline(true);
      setWasOffline(false);
      return true;
    } catch { return false; }
  }, [applyState, handle401, wasOffline]);

  useEffect(() => {
    (async () => {
      const ok = await fetchState();
      if (ok) return;
      // Offline / belum login: pakai cache lokal atau seed (mode demo)
      setWasOffline(true); // tandai untuk merge saat kembali online
      const init = load();
      if (init && init.users?.length) {
        setUsers(init.users); setKelas(init.kelas || seedKelas); setKategori(init.kategori || seedKategori);
        setPengajuan(init.pengajuan || seedPengajuan); setSettings(normSettings(init.settings)); setAuditTrail(init.auditTrail || []);
        try { const rawPeng = localStorage.getItem(PENG_KEY); setPengumuman(rawPeng ? JSON.parse(rawPeng) : seedPengumuman); } catch { setPengumuman(seedPengumuman); }
      } else {
        setUsers(seedUsers); setKelas(seedKelas); setKategori(seedKategori); setPengajuan(seedPengajuan);
      }
    })();
  }, [fetchState]);

  useEffect(() => { if (users.length) saveState({ users, kelas, kategori, pengajuan, auditTrail, settings }); }, [users, kelas, kategori, pengajuan, auditTrail, settings]);
  useEffect(() => { if (user) localStorage.setItem("perizinan_user", JSON.stringify(user)); else localStorage.removeItem("perizinan_user"); }, [user]);

  const login = useCallback(async (username, password, remember = false) => {
    const clean = String(username).trim();
    // Server dulu (sumber kebenaran)
    try {
      const res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: clean, password }) });
      if (res.ok) {
        const data = await res.json();
        if (remember) {
          localStorage.setItem(TOKEN_KEY, data.token);
        } else {
          sessionStorage.setItem(TOKEN_KEY, data.token);
          localStorage.removeItem(TOKEN_KEY);
        }
        setUser(data.user);
        setOnline(true);
        await fetchState();
        return { ok:true, user: data.user };
      }
      const e = await res.json().catch(() => null);
      return { ok:false, error: e?.error || 'Username/NIS atau password salah' };
    } catch {
      // Offline: verifikasi lokal (mode demo)
      const source = users.length ? users : seedUsers;
      const u = source.find(x => (x.username===clean || x.nis===clean) && x.password===password);
      if (!u) return { ok:false, error:"Username/NIS atau password salah" };
      if (remember) {
        localStorage.setItem(TOKEN_KEY, "");
      } else {
        sessionStorage.setItem(TOKEN_KEY, "");
        localStorage.removeItem(TOKEN_KEY);
      }
      setOnline(false);
      setUser(u); return { ok:true, user:u, offline:true };
    }
  }, [users, fetchState]);

  const call = useCallback(async (path, method, body) => {
    const res = await fetch(path, { method, headers: { 'Content-Type':'application/json', ...authHeaders() }, body: body !== undefined ? JSON.stringify(body) : undefined });
    if (res.status === 401) handle401(true);
    const payload = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data: payload };
  }, [handle401]);

  // Scan gerbang (satpam) via AppContext agar penanganan 401/token konsisten
  const scanKode = useCallback(async (kode) => {
    const clean = String(kode || "").trim().toUpperCase();
    if (!clean) return { ok:false, error:'Kode kosong' };
    const r = await call('/api/scan', 'POST', { kode: clean });
    if (!r.ok) return r;
    await fetchState();
    return r;
  }, [call, fetchState]);

  // Kirim notifikasi keterlambatan (dicatat di audit trail)
  const sendNotification = useCallback(async (izinId, ke) => {
    const r = await call('/api/notifikasi-terlambat', 'POST', { izin_id: izinId, ke });
    if (r.ok) await fetchState();
    return r;
  }, [call, fetchState]);

  // Helper error seragam: kembalikan { ok:false, error } dari respons server
  const errMsg = (r, fallback='Gagal menyimpan ke server') => ({ ok:false, error: r.data?.error || `${fallback} (HTTP ${r.status})` });

  // ---------- Pengajuan ----------
  const createPengajuan = useCallback(async (data) => {
    const id = "izin-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    // created_at ditangani sepenuhnya oleh server — client tidak boleh menentukan
    const item = { id, status:"diajukan", kode:"", catatan_piket:"", catatan_bk:"", catatan_wali:"", waktu_keluar_aktual:"", waktu_masuk_aktual:"", lampiran:"", ...data };
    try {
      const r = await call('/api/pengajuan', 'POST', item);
      if (r.ok) { await fetchState(); return r.data; }
      throw new Error(r.data?.error || 'Gagal mengirim pengajuan');
    } catch (e) {
      if (isNetErr(e)) { setPengajuan(p => [item, ...p]); setAuditTrail(a => [...a, { id:"a"+Date.now(), izin_id:id, actor:data.siswa_nama||"siswa", role:"siswa", action:"Ajukan Izin", old_status:"-", new_status:"diajukan", at:new Date().toISOString() }]); return item; }
      throw e;
    }
  }, [call, fetchState]);

  const updateStatus = useCallback(async (id, patch) => {
    try {
      const r = await call(`/api/pengajuan/${id}`, 'PATCH', patch);
      if (r.ok) { await fetchState(); return true; }
      alert(r.data?.error || 'Gagal update ke server');
      await fetchState();
      return false;
    } catch (e) {
      if (isNetErr(e)) {
        const finalPatch = { ...patch };
        if (finalPatch.status === 'menunggu_keluar' && !finalPatch.kode) {
          finalPatch.kode = 'IZN-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        }
        setPengajuan(p => p.map(x => x.id===id ? { ...x, ...finalPatch } : x));
        setAuditTrail(a => [...a, { id:"a"+Date.now(), izin_id:id, actor:user?.nama||"sistem", role:user?.role||"system", action:"Update status", old_status:"", new_status:finalPatch.status||"", at:new Date().toISOString() }]);
        return true;
      }
      alert('Gagal update ke server');
      await fetchState();
      return false;
    }
  }, [call, fetchState, user]);

  // ---------- Users (admin) ----------
  const createUser = useCallback(async (data) => {
    try {
      const r = await call('/api/users', 'POST', data);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menambah user');
    } catch (e) {
      if (isNetErr(e)) { setUsers(u => [...u, { id:"u"+Date.now(), status:"aktif", ...data, nis:data.username, nisn:"" }]); return { ok:true, offline:true }; }
      throw e;
    }
  }, [call, fetchState]);

  const updateUser = useCallback(async (id, patch) => {
    try {
      const r = await call(`/api/users/${id}`, 'PATCH', patch);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menyimpan user');
    } catch (e) {
      if (isNetErr(e)) { setUsers(u => u.map(x => x.id===id ? { ...x, ...patch } : x)); return { ok:true, offline:true }; }
      throw e;
    }
  }, [call, fetchState]);

  const deleteUsers = useCallback(async (ids) => {
    try {
      const r = await call('/api/users', 'DELETE', { ids });
      if (r.ok) { await fetchState(); return { ok:true, deleted: r.data?.deleted ?? 0, blocked: r.data?.blocked || [] }; }
      return errMsg(r, 'Gagal menghapus user');
    } catch (e) {
      if (isNetErr(e)) { setUsers(u => u.filter(x => !ids.includes(x.id))); return { ok:true, offline:true, deleted: ids.length, blocked: [] }; }
      throw e;
    }
  }, [call, fetchState]);

  const importUsers = useCallback(async (rows) => {
    try {
      const r = await call('/api/users/bulk', 'POST', { rows });
      if (r.ok) { await fetchState(); return { ok:true, ...r.data }; }
      return errMsg(r, 'Gagal import');
    } catch (e) {
      if (isNetErr(e)) return { ok:false, error:'Server tidak terjangkau — mode offline, import dibatalkan' };
      throw e;
    }
  }, [call, fetchState]);

  // ---------- Kategori ----------
  const saveKategori = useCallback(async (id, data) => {
    try {
      const r = id
        ? await call(`/api/kategori/${id}`, 'PATCH', data)
        : await call('/api/kategori', 'POST', data);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menyimpan kategori');
    } catch (e) {
      if (isNetErr(e)) {
        if (id) setKategori(k => k.map(x => x.id===id ? { ...x, ...data } : x));
        else setKategori(k => [...k, { id:"kat"+Date.now(), ...data }]);
        return { ok:true, offline:true };
      }
      throw e;
    }
  }, [call, fetchState]);

  const deleteKategori = useCallback(async (id) => {
    try {
      const r = await call(`/api/kategori/${id}`, 'DELETE');
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menghapus kategori');
    } catch (e) {
      if (isNetErr(e)) { setKategori(k => k.filter(x => x.id !== id)); return { ok:true, offline:true }; }
      throw e;
    }
  }, [call, fetchState]);

  // ---------- Kelas ----------
  const saveKelas = useCallback(async (id, data) => {
    try {
      const r = id
        ? await call(`/api/kelas/${id}`, 'PATCH', data)
        : await call('/api/kelas', 'POST', data);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menyimpan kelas');
    } catch (e) {
      if (isNetErr(e)) {
        if (id) setKelas(k => k.map(x => x.id===id ? { ...x, ...data } : x));
        else setKelas(k => [...k, { id:"k"+Date.now(), ...data }]);
        return { ok:true, offline:true };
      }
      throw e;
    }
  }, [call, fetchState]);

  const deleteKelas = useCallback(async (id) => {
    try {
      const r = await call(`/api/kelas/${id}`, 'DELETE');
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menghapus kelas');
    } catch (e) {
      if (isNetErr(e)) { setKelas(k => k.filter(x => x.id !== id)); return { ok:true, offline:true }; }
      throw e;
    }
  }, [call, fetchState]);

  // ---------- Pengumuman ----------
  const savePengumuman = useCallback(async (id, data) => {
    try {
      const r = id
        ? await call(`/api/pengumuman/${id}`, 'PUT', data)
        : await call('/api/pengumuman', 'POST', data);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menyimpan pengumuman');
    } catch (e) {
      if (isNetErr(e)) {
        setPengumuman(list => {
          const next = id ? list.map(x => x.id===id ? { ...x, ...data } : x) : [{ id:"p"+Date.now(), ...data }, ...list];
          localStorage.setItem(PENG_KEY, JSON.stringify(next));
          return next;
        });
        return { ok:true, offline:true };
      }
      throw e;
    }
  }, [call, fetchState]);

  const deletePengumuman = useCallback(async (id) => {
    try {
      const r = await call(`/api/pengumuman/${id}`, 'DELETE');
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menghapus pengumuman');
    } catch (e) {
      if (isNetErr(e)) { setPengumuman(list => { const next = list.filter(x => x.id !== id); localStorage.setItem(PENG_KEY, JSON.stringify(next)); return next; }); return { ok:true, offline:true }; }
      throw e;
    }
  }, [call, fetchState]);

  const resetPengumuman = useCallback(async () => {
    // Offline: kembalikan ke bawaan; Online: server akan menyimpan hanya saat ada aksi simpan
    setPengumuman(seedPengumuman);
    if (!online) localStorage.setItem(PENG_KEY, JSON.stringify(seedPengumuman));
  }, [online]);

  // ---------- Settings (admin) ----------
  const saveSettings = useCallback(async (next) => {
    setSettings(next); // optimistic
    try {
      const r = await call('/api/settings', 'PUT', next);
      if (r.ok) { await fetchState(); return { ok:true }; }
      return errMsg(r, 'Gagal menyimpan pengaturan');
    } catch (e) {
      if (isNetErr(e)) return { ok:true, offline:true };
      throw e;
    }
  }, [call, fetchState]);

  const value = {
    user, setUser, login, logout, online,
    users, setUsers, kelas, setKelas, kategori, setKategori, pengajuan, setPengajuan,
    createPengajuan, updateStatus, auditTrail, settings, setSettings, saveSettings,
    pengumuman, savePengumuman, deletePengumuman, resetPengumuman,
    createUser, updateUser, deleteUsers, importUsers,
    saveKategori, deleteKategori, saveKelas, deleteKelas,
    call, scanKode, sendNotification,
    refresh: fetchState,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useApp = () => useContext(Ctx);
