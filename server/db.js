import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import os from 'os';
import { seedUsers, seedKelas, seedKategori, seedPengajuan, seedPengumuman } from './seed.js';

// Deteksi lingkungan Serverless (Vercel / AWS Lambda)
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const ROOT_DB_PATH = path.resolve('perizinan.db');
const INITIAL_DATA_PATH = path.resolve('initial_data.json');

// Di Vercel, hanya /tmp yang diizinkan untuk operasi tulis (writable).
// Di lokal, gunakan perizinan.db di root folder atau sesuai env DB_PATH.
export const DB_PATH = isVercel
  ? path.join(os.tmpdir(), 'perizinan.db')
  : (process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : ROOT_DB_PATH);
const TMP_PATH = DB_PATH + '.tmp';

// Database URL fallback hook (jika dihubungkan ke PostgreSQL/Supabase/Neon di masa depan)
if (process.env.DATABASE_URL) {
  console.log('[DB] Terdeteksi DATABASE_URL eksternal:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
}

// Inisialisasi awal file DB
function initDBFile() {
  if (fs.existsSync(DB_PATH)) return;
  try {
    if (fs.existsSync(INITIAL_DATA_PATH)) {
      fs.copyFileSync(INITIAL_DATA_PATH, DB_PATH);
      console.log(`[DB] Berhasil memuat data awal dari ${INITIAL_DATA_PATH} ke ${DB_PATH}`);
    } else if (fs.existsSync(ROOT_DB_PATH) && ROOT_DB_PATH !== DB_PATH) {
      fs.copyFileSync(ROOT_DB_PATH, DB_PATH);
      console.log(`[DB] Menyalin basis data root ke lingkungan sementara: ${DB_PATH}`);
    } else {
      fs.writeFileSync(DB_PATH, '{}');
    }
  } catch (err) {
    console.warn('[DB Init Warning]', err.message);
  }
}
initDBFile();

// ---------- Password hashing (scrypt) ----------
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex'); const b = Buffer.from(candidate, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const isHashed = (p) => typeof p === 'string' && p.includes(':');

// ---------- JSON database dengan atomic write + antrean tulis ----------
let cachedDB = null;

function loadDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    cachedDB = JSON.parse(raw);
    return cachedDB;
  } catch (err) {
    if (cachedDB) return cachedDB;
    return { users: [], kelas: [], kategori: [], pengajuan: [], auditTrail: [], pengumuman: [], settings: {}, tokens: [] };
  }
}

function writeFileSyncSafe(targetPath, data) {
  try {
    fs.writeFileSync(TMP_PATH, data);
    try {
      fs.renameSync(TMP_PATH, targetPath);
    } catch (e) {
      // Fallback untuk Windows jika rename terkunci (EPERM/EBUSY)
      fs.copyFileSync(TMP_PATH, targetPath);
      try { fs.unlinkSync(TMP_PATH); } catch {}
    }
  } catch (err) {
    // Jika masih gagal, tulis langsung ke target file
    fs.writeFileSync(targetPath, data);
  }
}

let writeQueue = Promise.resolve();
function saveDB(db) {
  cachedDB = db;
  writeQueue = writeQueue.then(() => {
    writeFileSyncSafe(DB_PATH, JSON.stringify(db, null, 2));
  });
  return writeQueue;
}

// Atomic update: baca → ubah → tulis (dalam antrean agar tidak saling timpa)
export function updateDB(mutator) {
  let result;
  writeQueue = writeQueue.then(() => {
    const db = loadDB();
    result = mutator(db);
    cachedDB = db;
    writeFileSyncSafe(DB_PATH, JSON.stringify(db, null, 2));
  });
  return writeQueue.then(() => result);
}
const ensureDefaults = (db) => {
  db.tokens = db.tokens || [];
  db.pengumuman = db.pengumuman || seedPengumuman.map(p => ({ ...p }));
  db.auditTrail = db.auditTrail || [];
  db.settings = db.settings || { idleTimeoutMenit: '30', batasTerlambatMenit: '15', jam_masuk: '06:30', jam_pulang: '16:00' };
  return db;
};
function ensureSeed() {
  let db = loadDB();
  if (db && db.users && db.users.length > 0) {
    ensureDefaults(db);
    migratePasswords(db);
    saveDB(db);
    return db;
  }

  // Jika database kosong, coba isi dari initial_data.json jika ada
  if (fs.existsSync(INITIAL_DATA_PATH)) {
    try {
      const raw = fs.readFileSync(INITIAL_DATA_PATH, 'utf8');
      const loaded = JSON.parse(raw);
      if (loaded && loaded.users && loaded.users.length > 0) {
        db = ensureDefaults(loaded);
        migratePasswords(db);
        saveDB(db);
        console.log('[DB] Database diinisialisasi otomatis dari initial_data.json');
        return db;
      }
    } catch (e) {
      console.warn('[DB Seed Warning]', e.message);
    }
  }

  db = {
    users: seedUsers.map(u => ({ ...u, password: hashPassword(u.password) })),
    kelas: seedKelas, kategori: seedKategori, pengajuan: seedPengajuan,
    auditTrail: [], pengumuman: seedPengumuman.map(p => ({ ...p })), tokens: [],
    settings: { idleTimeoutMenit: '30', batasTerlambatMenit: '15', jam_masuk: '06:30', jam_pulang: '16:00' },
  };
  saveDB(db); return db;
}
function migratePasswords(db) {
  let changed = false;
  for (const u of db.users || []) {
    if (!isHashed(u.password)) { u.password = hashPassword(u.password); changed = true; }
  }
  return changed;
}
ensureSeed();

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
const stripPassword = ({ password, ...rest }) => rest;

export const queries = {
  // --- state (tanpa password) ---
  getState: () => {
    const db = loadDB();
    return {
      users: db.users.map(stripPassword),
      kelas: db.kelas, kategori: db.kategori,
      pengajuan: db.pengajuan, auditTrail: db.auditTrail || [],
      pengumuman: db.pengumuman || [], settings: db.settings,
    };
  },
  getUsers: () => loadDB().users.map(stripPassword),
  getKelas: () => loadDB().kelas,
  getKategori: () => loadDB().kategori,
  getPengajuan: () => loadDB().pengajuan,
  getAudit: () => loadDB().auditTrail || [],
  getPengumuman: () => loadDB().pengumuman || [],
  getSettings: () => loadDB().settings,

  // --- auth ---
  findByLogin: (username, password) => {
    const db = loadDB();
    const u = db.users.find(x => (x.username === username || x.nis === username));
    if (!u || !verifyPassword(password, u.password)) return null;
    const { password: _, ...safe } = u;
    return safe;
  },
  createToken: (userId) => updateDB(db => {
    ensureDefaults(db);
    db.tokens = db.tokens.filter(t => new Date(t.expiresAt) > new Date());
    const token = crypto.randomBytes(32).toString('hex');
    db.tokens.push({ token, userId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() });
    return token;
  }),
  resolveToken: (token) => {
    const db = loadDB();
    if (!token) return null;
    const rec = (db.tokens || []).find(t => t.token === token);
    if (!rec) return null;
    if (new Date(rec.expiresAt) <= new Date()) return null;
    const u = db.users.find(x => x.id === rec.userId);
    if (!u) return null;
    const { password: _, ...safe } = u;
    return safe;
  },
  revokeToken: (token) => updateDB(db => {
    db.tokens = (db.tokens || []).filter(t => t.token !== token);
  }),

  // --- pengajuan ---
  findPengajuanByKode: (kode) => {
    const db = loadDB();
    return db.pengajuan.find(x => x.kode === String(kode).trim().toUpperCase()) || null;
  },
  findPengajuanById: (id) => {
    const db = loadDB();
    return db.pengajuan.find(x => x.id === id) || null;
  },
  addPengajuan: (p) => updateDB(db => { db.pengajuan.unshift(p); }),
  updatePengajuan: (id, patch) => updateDB(db => {
    const idx = db.pengajuan.findIndex(x => x.id === id);
    if (idx < 0) return null;
    db.pengajuan[idx] = { ...db.pengajuan[idx], ...patch };
    return db.pengajuan[idx];
  }),
  addAudit: (a) => updateDB(db => { db.auditTrail = db.auditTrail || []; db.auditTrail.push(a); }),

  // --- users ---
  addUser: (u) => updateDB(db => {
    const user = { ...u, password: hashPassword(u.password || '1234') };
    db.users.push(user);
    const { password: _, ...safe } = user;
    return safe;
  }),
  addUsersBulk: (list) => updateDB(db => {
    const existing = new Set(db.users.map(u => u.username));
    const imported = []; let skipped = 0; const errors = [];
    const ROLES = ['siswa','piket','bk','wali_kelas','satpam','admin'];
    for (const [i, r] of list.entries()) {
      const username = String(r.username || '').trim();
      const nama = String(r.nama || '').trim();
      if (!username || !nama) { errors.push({ row: i + 1, reason: 'Username/NIS atau nama kosong' }); continue; }
      if (existing.has(username)) { skipped++; continue; }
      existing.add(username);
      const role = ROLES.includes(String(r.role || '').toLowerCase()) ? String(r.role).toLowerCase() : 'siswa';
      db.users.push({ id: 'u' + Date.now() + '-' + i, username, nama, nis: username, nisn: '', status: 'aktif', role, kelas: String(r.kelas || '').trim(), nip: r.nip ? String(r.nip).trim() : undefined, password: hashPassword(r.password || '1234') });
      imported.push(username);
    }
    return { imported: imported.length, skipped, errors };
  }),
  updateUser: (id, patch) => updateDB(db => {
    const idx = db.users.findIndex(x => x.id === id);
    if (idx < 0) return null;
    const { password, ...rest } = patch;
    const admins = db.users.filter(u => u.role === 'admin');
    if (db.users[idx].role === 'admin' && rest.role && rest.role !== 'admin' && admins.length <= 1) {
      return { error: 'Minimal satu admin harus tersisa' };
    }
    if (rest.username) {
      const clash = db.users.find(x => x.id !== id && x.username === rest.username);
      if (clash) return { error: 'Username/NIS sudah dipakai user lain' };
    }
    const updated = { ...db.users[idx], ...rest };
    if (password) updated.password = hashPassword(password);
    db.users[idx] = updated;
    const { password: _, ...safe } = updated;
    return safe;
  }),
  deleteUsers: (ids = [], actorId) => updateDB(db => {
    const blocked = [];
    const deleteSet = new Set(ids);
    if (actorId && deleteSet.delete(actorId)) blocked.push('Akun Anda sendiri dilewati');
    const admins = db.users.filter(u => u.role === 'admin');
    const adminsToDelete = db.users.filter(u => deleteSet.has(u.id) && u.role === 'admin').length;
    if (adminsToDelete >= admins.length) return { deleted: 0, blocked: [...blocked, 'Minimal satu admin harus tersisa'] };
    const before = db.users.length;
    db.users = db.users.filter(u => !deleteSet.has(u.id));
    return { deleted: before - db.users.length, blocked };
  }),

  // --- kategori ---
  addKategori: (k) => updateDB(db => { db.kategori.push(k); return k; }),
  updateKategori: (id, patch) => updateDB(db => {
    const idx = db.kategori.findIndex(x => x.id === id);
    if (idx < 0) return null;
    db.kategori[idx] = { ...db.kategori[idx], ...patch };
    return db.kategori[idx];
  }),
  deleteKategori: (id) => updateDB(db => {
    const before = db.kategori.length;
    db.kategori = db.kategori.filter(x => x.id !== id);
    return before - db.kategori.length;
  }),

  // --- kelas ---
  addKelas: (k) => updateDB(db => { db.kelas.push(k); return k; }),
  updateKelas: (id, patch) => updateDB(db => {
    const idx = db.kelas.findIndex(x => x.id === id);
    if (idx < 0) return null;
    db.kelas[idx] = { ...db.kelas[idx], ...patch };
    return db.kelas[idx];
  }),
  deleteKelas: (id) => updateDB(db => {
    const before = db.kelas.length;
    db.kelas = db.kelas.filter(x => x.id !== id);
    return before - db.kelas.length;
  }),

  // --- pengumuman ---
  addPengumuman: (p) => updateDB(db => { db.pengumuman = db.pengumuman || []; db.pengumuman.unshift(p); return p; }),
  updatePengumuman: (id, patch) => updateDB(db => {
    const list = db.pengumuman || [];
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch };
    return list[idx];
  }),
  deletePengumuman: (id) => updateDB(db => {
    const before = (db.pengumuman || []).length;
    db.pengumuman = (db.pengumuman || []).filter(x => x.id !== id);
    return before - db.pengumuman.length;
  }),

  // --- settings ---
  saveSettings: (settings) => updateDB(db => { db.settings = { ...db.settings, ...settings }; return db.settings; }),

  // --- backup & export ---
  exportBackup: (targetPath = 'initial_data.json') => {
    const db = loadDB();
    if (!db) return false;
    const { tokens, ...clean } = db;
    fs.writeFileSync(path.resolve(targetPath), JSON.stringify({ ...clean, tokens: [] }, null, 2), 'utf8');
    return true;
  },
};
export default { loadDB, saveDB, updateDB };
