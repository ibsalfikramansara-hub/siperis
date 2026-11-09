import express from 'express';
import cors from 'cors';
import path from 'path'; import { fileURLToPath } from 'url';
import { queries } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Konfigurasi CORS & Trusted Origins (Local, Vercel *.vercel.app, Cloudflare *.trycloudflare.com)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.trycloudflare.com') ||
      origin.endsWith('.loca.lt')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
}));

app.use(express.json({ limit: '5mb' })); // muat lampiran base64 (maks 2 MB file)
// Data API selalu fresh — tanpa cache agar perubahan terlihat di semua perangkat
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { index: false, maxAge: '7d', setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store'); } }));

// ---------- Rate limit login (in-memory, per IP) ----------
const attempts = new Map();
const WINDOW_MS = 60_000, MAX_ATTEMPTS = 10;
const loginLimiter = (req, res, next) => {
  const now = Date.now();
  const rec = attempts.get(req.ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + WINDOW_MS; }
  rec.count++;
  attempts.set(req.ip, rec);
  if (rec.count > MAX_ATTEMPTS) return res.status(429).json({ error: 'Terlalu banyak percobaan login. Coba lagi 1 menit lagi.' });
  next();
};

// ---------- Auth ----------
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = queries.resolveToken(token);
  if (!user) return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa' });
  req.user = user; req.token = token;
  next();
};
const adminOnly = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Hanya admin' });
const staffOnly = (req, res, next) => ['piket','bk','wali_kelas','satpam','admin'].includes(req.user?.role) ? next() : res.status(403).json({ error: 'Tidak diizinkan untuk role ini' });
const satpamOnly = (req, res, next) => req.user?.role === 'satpam' ? next() : res.status(403).json({ error: 'Hanya satpam yang dapat scan gerbang' });
const announcementRoles = (req, res, next) => ['admin','bk','wali_kelas'].includes(req.user?.role) ? next() : res.status(403).json({ error: 'Hanya admin / BK / Wali Kelas' });

// ---------- Public ----------
app.get('/api/health', (req, res) => res.json({ ok: true, at: new Date().toISOString() }));
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
  const u = queries.findByLogin(String(username).trim(), String(password));
  if (!u) return res.status(401).json({ error: 'Username/NIS atau password salah' });
  const token = await queries.createToken(u.id);
  res.json({ token, user: u });
});

// ---------- Auth required ----------
app.post('/api/logout', auth, async (req, res) => { await queries.revokeToken(req.token); res.json({ ok: true }); });
app.get('/api/state', auth, (req, res) => res.json(queries.getState()));

// Helper tanggal lokal Indonesia (WIB UTC+7) YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const tzOffset = 7 * 60; // WIB
  const local = new Date(d.getTime() + (d.getTimezoneOffset() + tzOffset) * 60000);
  return local.toISOString().slice(0, 10);
};

// ---------- Pengajuan ----------
const ALLOWED_PATCH = ['status','kode','catatan_piket','catatan_bk','catatan_wali','waktu_keluar_aktual','waktu_masuk_aktual'];
app.post('/api/pengajuan', auth, async (req, res) => {
  const body = req.body || {};
  const now = new Date().toISOString();
  const isSiswa = req.user.role === 'siswa';

  const kategori = queries.getKategori().find(k => k.id === body.kategori_id);
  if (!kategori) return res.status(400).json({ error: 'Kategori tidak ditemukan' });

  const estimasi = Number(body.estimasi_menit) || 60;
  if (estimasi > kategori.maks_durasi_menit) return res.status(400).json({ error: `Durasi maksimal ${kategori.maks_durasi_menit} menit untuk kategori ${kategori.nama}` });

  const todayStr = getLocalDateString();
  if (!body.tanggal || body.tanggal < todayStr) return res.status(400).json({ error: 'Tanggal izin sudah lewat' });

  const settings = queries.getSettings() || {};
  const jamMasuk = settings.jam_masuk || '06:30';
  const jamPulang = settings.jam_pulang || '16:00';
  const [jm, jmen] = String(body.jam_mulai || '').split(':').map(Number);
  const menit = (jm || 0) * 60 + (jmen || 0);
  const [im, imn] = jamMasuk.split(':').map(Number);
  const [pm, pmn] = jamPulang.split(':').map(Number);
  if (menit < im * 60 + imn || menit > pm * 60 + pmn) return res.status(400).json({ error: `Di luar jam sekolah efektif (${jamMasuk}–${jamPulang})` });

  if (!body.keperluan) return res.status(400).json({ error: 'Keperluan wajib diisi' });

  // Validasi lampiran (tipe file yang diizinkan: image/*, pdf)
  if (body.lampiran && typeof body.lampiran === 'string') {
    const allowedMime = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
    if (!allowedMime.some(m => body.lampiran.startsWith('data:' + m + ';'))) {
      return res.status(400).json({ error: 'Tipe lampiran tidak diizinkan (hanya gambar dan PDF)' });
    }
  }

  let targetSiswa = null;
  if (isSiswa) {
    // Siswa hanya boleh mengajukan untuk dirinya sendiri
    targetSiswa = req.user;
  } else if (body.siswa_id) {
    // Staff membuat untuk siswa lain — validasi hak akses
    targetSiswa = queries.getUsers().find(u => u.id === body.siswa_id);
    if (!targetSiswa) return res.status(400).json({ error: 'Siswa tidak ditemukan' });
    if (targetSiswa.role !== 'siswa') return res.status(400).json({ error: 'ID yang dipilih bukan siswa' });
    // Wali kelas hanya boleh mengajukan untuk siswa di kelasnya
    const waliKelas = req.user.kelas || queries.getKelas().find(k => k.wali_kelas_id === req.user.id)?.nama;
    if (req.user.role === 'wali_kelas' && waliKelas && targetSiswa.kelas !== waliKelas) {
      return res.status(403).json({ error: `Bukan siswa kelas Anda (${waliKelas})` });
    }
  } else {
    targetSiswa = req.user;
  }

  // Server-generated timestamps — client tidak boleh menentukan created_at
  const p = {
    id: 'izin-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    siswa_id: targetSiswa.id,
    siswa_nama: targetSiswa.nama,
    kelas: targetSiswa.kelas || '',
    kategori_id: body.kategori_id,
    kategori_nama: kategori.nama,
    tanggal: body.tanggal,
    jam_mulai: body.jam_mulai,
    estimasi_menit: estimasi,
    keperluan: body.keperluan,
    lampiran: typeof body.lampiran === 'string' ? body.lampiran : '',
    status: 'diajukan', kode: '',
    catatan_piket: '', catatan_bk: '', catatan_wali: '',
    created_at: now, waktu_keluar_aktual: '', waktu_masuk_aktual: '',
  };
  await queries.addPengajuan(p);
  await queries.addAudit({ id: 'a' + Date.now(), izin_id: p.id, actor: req.user.nama, role: req.user.role, action: 'Ajukan Izin', old_status: '-', new_status: 'diajukan', at: now });
  res.json(p);
});
// Field yang boleh diubah per role untuk PATCH /api/pengajuan/:id
const PATCH_FIELDS_BY_ROLE = {
  piket: ['status','catatan_piket'],
  bk: ['status','catatan_bk'],
  wali_kelas: ['status','catatan_wali'],
  satpam: [], // satpam hanya lewat /api/scan, tidak lewat PATCH ini
  admin: ['status','kode','catatan_piket','catatan_bk','catatan_wali','waktu_keluar_aktual','waktu_masuk_aktual'],
};

app.patch('/api/pengajuan/:id', auth, staffOnly, async (req, res) => {
  const body = req.body || {};

  // Satpam dilarang mengakses PATCH ini (hanya /api/scan)
  if (req.user.role === 'satpam') {
    return res.status(403).json({ error: 'Satpam tidak boleh mengubah status lewat endpoint ini, gunakan /api/scan' });
  }

  const allowedFields = PATCH_FIELDS_BY_ROLE[req.user.role] || [];
  const patch = {};
  for (const k of Object.keys(body)) {
    if (allowedFields.includes(k)) patch[k] = body[k];
  }

  // Ambil data lama untuk audit trail (old_status)
  const existing = queries.findPengajuanById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
  const oldStatus = existing.status;

  // Wali kelas hanya boleh memverifikasi siswa dari kelasnya
  if (req.user.role === 'wali_kelas') {
    const waliKelas = req.user.kelas || queries.getKelas().find(k => k.wali_kelas_id === req.user.id)?.nama;
    if (waliKelas && existing.kelas !== waliKelas) {
      return res.status(403).json({ error: `Pengajuan ini milik kelas ${existing.kelas}, bukan kelas Anda (${waliKelas})` });
    }
  }

  // Saat terbit (menunggu_keluar): kode wajib unik — SERVER yang hasilkan (client tidak boleh menentukan kode)
  if (patch.status === 'menunggu_keluar') {
    const all = queries.getPengajuan();
    let kode;
    let tries = 0;
    do { kode = 'IZN-' + Math.random().toString(36).slice(2, 8).toUpperCase(); tries++; }
    while (all.some(p => p.id !== req.params.id && p.kode === kode) && tries < 20);
    patch.kode = kode;
  }

  const updated = await queries.updatePengajuan(req.params.id, patch);
  await queries.addAudit({ id: 'a' + Date.now(), izin_id: req.params.id, actor: req.user.nama, role: req.user.role, action: 'Update status', old_status: oldStatus, new_status: patch.status || '', at: new Date().toISOString() });
  res.json(updated);
});

// ---------- Scan gerbang (satpam): server menentukan keluar vs masuk ----------
app.post('/api/scan', auth, satpamOnly, async (req, res) => {
  const { kode } = req.body || {};
  if (!kode) return res.status(400).json({ error: 'Kode wajib diisi' });
  const item = queries.findPengajuanByKode(kode);
  if (!item || !['menunggu_keluar','sudah_keluar'].includes(item.status)) {
    return res.status(404).json({ error: 'Kode tidak ditemukan / sudah tidak berlaku' });
  }
  const now = new Date().toISOString();
  if (item.status === 'menunggu_keluar') {
    const patch = { status: 'sudah_keluar', waktu_keluar_aktual: now };
    await queries.updatePengajuan(item.id, patch);
    await queries.addAudit({ id: 'a' + Date.now(), izin_id: item.id, actor: req.user.nama, role: req.user.role, action: 'Scan Keluar', old_status: item.status, new_status: 'sudah_keluar', at: now });
    return res.json({ outcome: 'keluar', item: { ...item, ...patch } });
  }
  const patch = { status: 'selesai', waktu_masuk_aktual: now };
  await queries.updatePengajuan(item.id, patch);
  await queries.addAudit({ id: 'a' + Date.now(), izin_id: item.id, actor: req.user.nama, role: req.user.role, action: 'Scan Masuk', old_status: item.status, new_status: 'selesai', at: now });
  return res.json({ outcome: 'masuk', item: { ...item, ...patch } });
});

// ---------- Users (admin) ----------
app.post('/api/users', auth, adminOnly, async (req, res) => {
  const { username, nama, password, role, kelas, nis } = req.body || {};
  if (!username || !nama) return res.status(400).json({ error: 'Username dan nama wajib diisi' });
  if (queries.getUsers().some(u => u.username === String(username).trim())) return res.status(409).json({ error: 'Username/NIS sudah terdaftar' });
  const ROLES = ['siswa','piket','bk','wali_kelas','satpam','admin'];
  const user = await queries.addUser({ id: 'u' + Date.now(), username: String(username).trim(), nis: String(nis || username).trim(), nisn: '', nama: String(nama).trim(), password: password || '1234', role: ROLES.includes(role) ? role : 'siswa', kelas: String(kelas || '').trim(), status: 'aktif' });
  res.json(user);
});
app.post('/api/users/bulk', auth, adminOnly, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  res.json(await queries.addUsersBulk(rows));
});
app.patch('/api/users/:id', auth, adminOnly, async (req, res) => {
  const { password, ...patch } = req.body || {};
  // Pastikan nis ikut tersimpan jika dikirim
  if (patch.nis === undefined && req.body.nis !== undefined) patch.nis = req.body.nis;
  const updated = await queries.updateUser(req.params.id, password ? { ...patch, password } : patch);
  if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (updated.error) return res.status(409).json({ error: updated.error });
  res.json(updated);
});
app.delete('/api/users', auth, adminOnly, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  res.json(await queries.deleteUsers(ids, req.user.id));
});

// ---------- Kategori (admin) ----------
app.post('/api/kategori', auth, adminOnly, async (req, res) => {
  const { nama, verifikator, maks_durasi_menit } = req.body || {};
  if (!nama) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  if (queries.getKategori().some(k => k.nama.trim().toLowerCase() === String(nama).trim().toLowerCase())) return res.status(409).json({ error: 'Nama kategori sudah ada' });
  res.json(await queries.addKategori({ id: 'kat' + Date.now(), nama: String(nama).trim(), verifikator: verifikator === 'bk' ? 'bk' : 'piket', maks_durasi_menit: Number(maks_durasi_menit) || 60 }));
});
app.patch('/api/kategori/:id', auth, adminOnly, async (req, res) => {
  const { nama, verifikator, maks_durasi_menit } = req.body || {};
  if (nama && queries.getKategori().some(k => k.id !== req.params.id && k.nama.trim().toLowerCase() === String(nama).trim().toLowerCase())) return res.status(409).json({ error: 'Nama kategori sudah ada' });
  const updated = await queries.updateKategori(req.params.id, { ...(nama ? { nama: String(nama).trim() } : {}), ...(verifikator ? { verifikator: verifikator === 'bk' ? 'bk' : 'piket' } : {}), ...(maks_durasi_menit !== undefined ? { maks_durasi_menit: Number(maks_durasi_menit) || 60 } : {}) });
  if (!updated) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
  res.json(updated);
});
app.delete('/api/kategori/:id', auth, adminOnly, async (req, res) => res.json({ deleted: await queries.deleteKategori(req.params.id) }));

// ---------- Kelas (admin) ----------
app.post('/api/kelas', auth, adminOnly, async (req, res) => {
  const { nama, wali_kelas_id } = req.body || {};
  if (!nama) return res.status(400).json({ error: 'Nama kelas wajib diisi' });
  if (queries.getKelas().some(k => k.nama.trim().toLowerCase() === String(nama).trim().toLowerCase())) return res.status(409).json({ error: 'Nama kelas sudah ada' });
  res.json(await queries.addKelas({ id: 'k' + Date.now(), nama: String(nama).trim(), wali_kelas_id: wali_kelas_id || '' }));
});
app.patch('/api/kelas/:id', auth, adminOnly, async (req, res) => {
  const { nama, wali_kelas_id } = req.body || {};
  if (nama && queries.getKelas().some(k => k.id !== req.params.id && k.nama.trim().toLowerCase() === String(nama).trim().toLowerCase())) return res.status(409).json({ error: 'Nama kelas sudah ada' });
  const patch = { ...(nama ? { nama: String(nama).trim() } : {}), ...(wali_kelas_id !== undefined ? { wali_kelas_id } : {}) };
  const updated = await queries.updateKelas(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
  res.json(updated);
});
app.delete('/api/kelas/:id', auth, adminOnly, async (req, res) => res.json({ deleted: await queries.deleteKelas(req.params.id) }));

// ---------- Pengumuman (admin / bk / wali_kelas) ----------
app.post('/api/pengumuman', auth, announcementRoles, async (req, res) => {
  const { judul, desc, tanggal } = req.body || {};
  if (!judul || !desc) return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi' });
  res.json(await queries.addPengumuman({ id: 'p' + Date.now(), tanggal: tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), judul: String(judul).trim(), desc: String(desc).trim() }));
});
app.put('/api/pengumuman/:id', auth, announcementRoles, async (req, res) => {
  const { judul, desc, tanggal } = req.body || {};
  const updated = await queries.updatePengumuman(req.params.id, { ...(judul !== undefined ? { judul: String(judul).trim() } : {}), ...(desc !== undefined ? { desc: String(desc).trim() } : {}), ...(tanggal !== undefined ? { tanggal } : {}) });
  if (!updated) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });
  res.json(updated);
});
app.delete('/api/pengumuman/:id', auth, announcementRoles, async (req, res) => res.json({ deleted: await queries.deletePengumuman(req.params.id) }));

// ---------- Notifikasi terlambat (satpam/wali/bk) ----------
app.post('/api/notifikasi-terlambat', auth, staffOnly, async (req, res) => {
  const { izin_id, ke } = req.body || {};
  if (!izin_id) return res.status(400).json({ error: 'ID izin wajib diisi' });
  const item = queries.findPengajuanById(izin_id);
  if (!item) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
  const now = new Date().toISOString();
  const tujuan = ke || 'Wali Kelas / BK / Orang Tua';
  await queries.addAudit({ id: 'a' + Date.now(), izin_id, actor: req.user.nama, role: req.user.role, action: 'Notifikasi Terlambat', old_status: item.status, new_status: item.status, at: now, catatan: `Notifikasi dikirim ke ${tujuan}` });
  res.json({ ok: true, izin_id, tujuan, at: now });
});

// ---------- Pengaturan (admin) ----------
app.put('/api/settings', auth, adminOnly, async (req, res) => {
  const allowed = ['idleTimeoutMenit', 'batasTerlambatMenit', 'jam_masuk', 'jam_pulang'];
  const patch = {};
  for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
  res.json(await queries.saveSettings(patch));
});

// ---------- 404 untuk API & SPA fallback ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.get('*', (req, res) => {
  const indexFile = path.join(distPath, 'index.html');
  if (path.basename(req.path).includes('.')) {
    return res.status(404).end();
  }
  import('fs').then(fs => {
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(200).send('<!DOCTYPE html><html><head><title>SIPERIS</title></head><body><h2>SIPERIS Server is running.</h2><p>Frontend belum di-build. Jalankan <code>npm run build</code> terlebih dahulu.</p></body></html>');
    }
  });
});

export default app;

// Jalankan HTTP server hanya jika dijalankan langsung (bukan serverless Vercel / bukan unit test)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4173;
  app.listen(PORT, () => console.log('Server Perizinan Siswa jalan di http://127.0.0.1:' + PORT));
}
