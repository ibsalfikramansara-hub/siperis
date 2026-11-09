export const seedUsers = [
  { id:"u1", nis:"1001", username:"1001", password:"1234", nama:"Ahmad Siswa", role:"siswa", kelas:"X RPL 1", nisn:"0001", gender:"L", foto:"", status:"aktif" },
  { id:"u2", nis:"1002", username:"1002", password:"1234", nama:"Budi Siswa", role:"siswa", kelas:"X RPL 1", nisn:"0002", gender:"L", foto:"", status:"aktif" },
  { id:"u3", nis:"1003", username:"1003", password:"1234", nama:"Citra Siswa", role:"siswa", kelas:"XI TKJ 1", nisn:"0003", gender:"P", foto:"", status:"aktif" },
  { id:"u4", nis:"2001", username:"piket01", password:"1234", nama:"Pak Piket", role:"piket", nip:"NP-01", status:"aktif" },
  { id:"u5", nis:"2002", username:"bk01", password:"1234", nama:"Bu BK", role:"bk", nip:"NP-02", status:"aktif" },
  { id:"u6", nis:"2003", username:"wali01", password:"1234", nama:"Bu Wali Kelas", role:"wali_kelas", nip:"NP-03", kelas:"X RPL 1", status:"aktif" },
  { id:"u7", nis:"2004", username:"satpam01", password:"1234", nama:"Pak Satpam", role:"satpam", nip:"NP-04", status:"aktif" },
  { id:"u8", nis:"2005", username:"admin01", password:"1234", nama:"Admin TU", role:"admin", nip:"NP-05", status:"aktif" },
];
export const seedKelas = [
  { id:"k1", nama:"X RPL 1", wali_kelas_id:"u6" },
  { id:"k2", nama:"XI TKJ 1", wali_kelas_id:"u6" },
  { id:"k3", nama:"X TKJ 2", wali_kelas_id:"u6" },
];
export const seedKategori = [
  { id:"kat1", nama:"Umum", verifikator:"piket", maks_durasi_menit:60 },
  { id:"kat2", nama:"Lomba", verifikator:"piket", maks_durasi_menit:180 },
  { id:"kat3", nama:"Beli Perlengkapan", verifikator:"piket", maks_durasi_menit:60 },
  { id:"kat4", nama:"Bimbingan", verifikator:"bk", maks_durasi_menit:60 },
  { id:"kat5", nama:"Konseling", verifikator:"bk", maks_durasi_menit:60 },
  { id:"kat6", nama:"Masalah Pribadi", verifikator:"bk", maks_durasi_menit:60 },
];
export const seedPengumuman = [
  { id:"f1", tanggal:"04 November 2026", judul:"Sistem Perizinan Siswa SISMEN v2.0 Resmi Diluncurkan", desc:"Assalamu'alaikum warahmatullahi wabarakatuh, Sehubungan dengan digitalisasi..." },
  { id:"f2", tanggal:"03 November 2026", judul:"Jadwal Jam Sekolah Semester Genap 2026/2027", desc:"Disampaikan kepada seluruh siswa dan orang tua bahwa jam masuk..." },
  { id:"f3", tanggal:"01 November 2026", judul:"Pendaftaran Beasiswa Cendekia Baznas Dalam Negeri Tahun 2026", desc:"Disampaikan dengan hormat, dalam rangka meningkatkan akses..." },
];

export const seedPengajuan = [
  { id:"izin-1", siswa_id:"u1", siswa_nama:"Ahmad Siswa", kelas:"X RPL 1", kategori_id:"kat3", kategori_nama:"Beli Perlengkapan", tanggal:"2026-11-04", jam_mulai:"09:00", estimasi_menit:60, keperluan:"Beli alat tulis", lampiran:"", status:"diajukan", kode:"", catatan_piket:"", catatan_bk:"", catatan_wali:"", created_at:"2026-11-04T08:00:00", waktu_keluar_aktual:"", waktu_masuk_aktual:"" },
  { id:"izin-2", siswa_id:"u3", siswa_nama:"Citra Siswa", kelas:"XI TKJ 1", kategori_id:"kat4", kategori_nama:"Bimbingan", tanggal:"2026-11-04", jam_mulai:"10:00", estimasi_menit:60, keperluan:"Bimbingan konseling", lampiran:"", status:"menunggu_keluar", kode:"IZN-A1B2C3", catatan_piket:"", catatan_bk:"Disetujui", catatan_wali:"Disetujui", created_at:"2026-11-04T07:30:00", waktu_keluar_aktual:"", waktu_masuk_aktual:"" },
  { id:"izin-3", siswa_id:"u2", siswa_nama:"Budi Siswa", kelas:"X RPL 1", kategori_id:"kat2", kategori_nama:"Lomba", tanggal:"2026-11-04", jam_mulai:"08:00", estimasi_menit:180, keperluan:"Lomba robotik", lampiran:"", status:"sudah_keluar", kode:"IZN-D4E5F6", catatan_piket:"Disetujui", catatan_bk:"", catatan_wali:"Disetujui", created_at:"2026-11-04T07:00:00", waktu_keluar_aktual:"2026-11-04T08:05:00", waktu_masuk_aktual:"" },
];
