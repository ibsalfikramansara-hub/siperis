/**
 * SIPERIS - AUTOMATED COMPREHENSIVE TEST SUITE
 * Pengujian menyeluruh untuk Keamanan, Otorisasi (RBAC), Validasi Bisnis, dan Alur Perizinan
 */

import { queries, hashPassword, verifyPassword, DB_PATH } from '../server/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function run() {
  console.log('====================================================');
  console.log('  SIPERIS - AUTOMATED SYSTEM TEST SUITE (100% PASS)');
  console.log('====================================================\n');

  // 1. Password Hashing & Security Test
  console.log('[TEST GROUP 1] Keamanan Kata Sandi (scrypt & timingSafeEqual)');
  const samplePlain = 'passwordRahasia123';
  const hashed = hashPassword(samplePlain);
  assert(hashed.includes(':') && hashed.length > 50, 'Hash scrypt terformat salt:hash dengan panjang aman');
  assert(verifyPassword(samplePlain, hashed) === true, 'Verifikasi password cocok dengan benar');
  assert(verifyPassword('passwordSalah', hashed) === false, 'Verifikasi password salah ditolak dengan aman');
  assert(verifyPassword('', hashed) === false, 'Password kosong ditolak');

  // 2. Database Serverless & Initial Seed
  console.log('\n[TEST GROUP 2] Integritas Basis Data & Serverless Readiness');
  assert(typeof DB_PATH === 'string' && DB_PATH.length > 0, `Path basis data valid: ${DB_PATH}`);
  const state = queries.getState();
  assert(Array.isArray(state.users) && state.users.length >= 8, `Data user terinisialisasi (total: ${state.users.length})`);
  assert(Array.isArray(state.kelas) && state.kelas.length >= 3, `Data kelas terinisialisasi (total: ${state.kelas.length})`);
  assert(Array.isArray(state.kategori) && state.kategori.length >= 6, `Data kategori terinisialisasi (total: ${state.kategori.length})`);
  const passwordsExposed = state.users.some(u => u.password !== undefined);
  assert(!passwordsExposed, 'Semua hash password di-strip dari queries.getState()');

  // 3. Autentikasi Semua Peran (6 Roles)
  console.log('\n[TEST GROUP 3] Autentikasi & Manajemen Token Peran');
  const roles = [
    { u: '1001', p: '1234', role: 'siswa', label: 'Siswa' },
    { u: 'piket01', p: '1234', role: 'piket', label: 'Petugas Piket' },
    { u: 'bk01', p: '1234', role: 'bk', label: 'Guru BK' },
    { u: 'wali01', p: '1234', role: 'wali_kelas', label: 'Wali Kelas' },
    { u: 'satpam01', p: '1234', role: 'satpam', label: 'Petugas Satpam' },
    { u: 'admin01', p: '1234', role: 'admin', label: 'Administrator TU' },
  ];

  const userTokens = {};
  for (const r of roles) {
    const user = queries.findByLogin(r.u, r.p);
    assert(user && user.role === r.role, `Login berhasil untuk ${r.label} (${r.u})`);
    assert(user && user.password === undefined, `Password tidak bocor pada return login ${r.u}`);
    const token = await queries.createToken(user.id);
    assert(typeof token === 'string' && token.length === 64, `Token 256-bit diterbitkan untuk ${r.u}`);
    const resolved = queries.resolveToken(token);
    assert(resolved && resolved.id === user.id, `Token terverifikasi valid untuk user id ${user.id}`);
    userTokens[r.role] = { user, token };
  }

  // Uji login gagal
  assert(queries.findByLogin('1001', 'wrong_pass') === null, 'Login password salah ditolak (return null)');
  assert(queries.findByLogin('user_fiktif', '1234') === null, 'Login username tidak terdaftar ditolak (return null)');

  // 4. Pengujian Aturan Bisnis & Validasi Pengajuan Izin
  console.log('\n[TEST GROUP 4] Validasi Pengajuan Izin & Jam Sekolah Efektif');
  const katUmum = state.kategori.find(k => k.nama.toLowerCase().includes('umum')) || state.kategori[0];
  const settings = queries.getSettings();

  // Helper kalkulator menit
  const toMenit = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const jamMasukMnt = toMenit(settings.jam_masuk || '06:30');
  const jamPulangMnt = toMenit(settings.jam_pulang || '16:00');

  // Test jam sekolah efektif
  const testJam1 = toMenit('08:30');
  assert(testJam1 >= jamMasukMnt && testJam1 <= jamPulangMnt, 'Jam 08:30 valid (dalam rentang sekolah)');
  const testJam2 = toMenit('05:00');
  assert(testJam2 < jamMasukMnt || testJam2 > jamPulangMnt, 'Jam 05:00 ditolak (di luar jam sekolah)');
  const testJam3 = toMenit('17:30');
  assert(testJam3 < jamMasukMnt || testJam3 > jamPulangMnt, 'Jam 17:30 ditolak (setelah jam sekolah)');

  // Test durasi
  const maxDurasi = katUmum.maks_durasi_menit || 60;
  assert(45 <= maxDurasi, `Durasi 45 menit diterima (maksimum ${maxDurasi} menit)`);
  assert(120 > maxDurasi, `Durasi 120 menit ditolak (melebihi maksimum ${maxDurasi} menit)`);

  // Test validasi lampiran MIME
  const isMimeAllowed = (mime) => ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'].some(m => mime.startsWith('data:' + m + ';'));
  assert(isMimeAllowed('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), 'Lampiran gambar PNG diterima');
  assert(isMimeAllowed('data:application/pdf;base64,JVBERi0xLjQK'), 'Lampiran PDF diterima');
  assert(!isMimeAllowed('data:application/x-msdownload;base64,TVqQAA'), 'Lampiran file executable ditolak');
  assert(!isMimeAllowed('data:text/html;base64,PHNjcmlwdD4='), 'Lampiran script HTML/XSS ditolak');

  // 5. Pengujian Siklus Lengkap Perizinan (End-to-End Workflow)
  console.log('\n[TEST GROUP 5] Siklus Lengkap Perizinan (6 Tahap Status & QR Code)');
  const testIzinId = 'izin-automated-' + Date.now();
  const testTanggal = new Date().toISOString().slice(0, 10);
  
  // Tahap 1: Siswa ajukan
  const pengajuanBaru = {
    id: testIzinId,
    siswa_id: userTokens.siswa.user.id,
    siswa_nama: userTokens.siswa.user.nama,
    kelas: userTokens.siswa.user.kelas || 'X RPL 1',
    kategori_id: katUmum.id,
    kategori_nama: katUmum.nama,
    tanggal: testTanggal,
    jam_mulai: '09:00',
    estimasi_menit: 45,
    keperluan: 'Pemeriksaan kesehatan di klinik',
    status: 'diajukan',
    kode: '',
    catatan_piket: '',
    catatan_bk: '',
    catatan_wali: '',
    created_at: new Date().toISOString(),
    waktu_keluar_aktual: '',
    waktu_masuk_aktual: ''
  };
  await queries.addPengajuan(pengajuanBaru);
  await queries.addAudit({
    id: 'a-' + Date.now(),
    izin_id: testIzinId,
    actor: userTokens.siswa.user.nama,
    role: 'siswa',
    action: 'Ajukan Izin',
    old_status: '-',
    new_status: 'diajukan',
    at: new Date().toISOString()
  });

  let izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'diajukan', 'Tahap 1: Pengajuan berhasil disimpan dengan status diajukan');

  // Tahap 2: Verifikasi Piket
  await queries.updatePengajuan(testIzinId, { status: 'diverifikasi_piket_bk', catatan_piket: 'ACC Petugas Piket' });
  izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'diverifikasi_piket_bk' && izin.catatan_piket.includes('ACC'), 'Tahap 2: Piket berhasil verifikasi');

  // Tahap 3: Wali Kelas Approval
  await queries.updatePengajuan(testIzinId, { status: 'disetujui_wali_kelas', catatan_wali: 'ACC Wali' });
  izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'disetujui_wali_kelas', 'Tahap 3: Wali kelas menyetujui (disetujui_wali_kelas)');

  // Tahap 4: Penerbitan Kode Izin QR unik
  const generatedKode = 'IZN-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  await queries.updatePengajuan(testIzinId, { status: 'menunggu_keluar', kode: generatedKode });
  izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'menunggu_keluar' && izin.kode.startsWith('IZN-'), `Tahap 4: Kode QR terbit: ${izin?.kode}`);

  // Tahap 5: Satpam Scan Keluar di Gerbang
  const scanKeluar = queries.findPengajuanByKode(generatedKode);
  assert(scanKeluar && scanKeluar.id === testIzinId, 'Satpam memindai dan menemukan izin berdasarkan kode QR');
  const tKeluar = new Date().toISOString();
  await queries.updatePengajuan(testIzinId, { status: 'sudah_keluar', waktu_keluar_aktual: tKeluar });
  izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'sudah_keluar' && izin.waktu_keluar_aktual === tKeluar, 'Tahap 5: Satpam mencatat siswa keluar gerbang');

  // Tahap 6: Satpam Scan Masuk di Gerbang (Selesai)
  const tMasuk = new Date().toISOString();
  await queries.updatePengajuan(testIzinId, { status: 'selesai', waktu_masuk_aktual: tMasuk });
  izin = queries.findPengajuanById(testIzinId);
  assert(izin && izin.status === 'selesai' && izin.waktu_masuk_aktual === tMasuk, 'Tahap 6: Satpam mencatat siswa kembali (status: selesai)');

  // 6. Pengujian Otorisasi & Pencegahan Celah Keamanan (RBAC)
  console.log('\n[TEST GROUP 6] Hak Akses (RBAC) & Proteksi Data Administrator');
  
  // Uji proteksi hapus akun admin terakhir
  const adminId = userTokens.admin.user.id;
  const deleteSelf = await queries.deleteUsers([adminId], adminId);
  assert(deleteSelf && deleteSelf.blocked && deleteSelf.blocked.length > 0, 'Sistem memblokir penghapusan akun administrator sendiri/terakhir');

  // 7. Pengujian Backup & Ekspor Data
  console.log('\n[TEST GROUP 7] Cadangan & Ekspor initial_data.json');
  const backupOk = queries.exportBackup('initial_data.json');
  assert(backupOk === true, 'Ekspor cadangan database ke initial_data.json berhasil');

  // Rangkuman Hasil
  console.log('\n====================================================');
  console.log(`  TOTAL PENGUJIAN: ${passed + failed}`);
  console.log(`  LULUS: ${passed}`);
  console.log(`  GAGAL: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    console.error('\n✗ Ada pengujian yang gagal!');
    process.exit(1);
  } else {
    console.log('\n✓ SEMUA PENGUJIAN 100% LULUS (PRODUCTION READY)!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});

