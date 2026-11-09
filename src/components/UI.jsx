export function StatusBadge({status}) {
  const map = {
    diajukan:"bg-[#FFA500] text-white",
    diverifikasi_piket_bk:"bg-blue-600 text-white",
    disetujui_wali_kelas:"bg-indigo-600 text-white",
    menunggu_keluar:"bg-purple-600 text-white",
    sudah_keluar:"bg-orange-600 text-white",
    sudah_kembali:"bg-teal-600 text-white",
    selesai:"bg-[#008000] text-white",
    ditolak:"bg-[#D00000] text-white",
  };
  const label = { diajukan:"Diajukan", diverifikasi_piket_bk:"Diverifikasi Piket/BK", disetujui_wali_kelas:"Disetujui Wali Kelas", menunggu_keluar:"Menunggu Keluar", sudah_keluar:"Sudah Keluar", sudah_kembali:"Sudah Kembali", selesai:"Selesai", ditolak:"Ditolak" };
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status]||"bg-gray-100"}`}>{label[status]||status}</span>;
}

export function Button({children, ...props}) {
  return <button {...props} className={props.className || "sismon-btn w-full"}>{children}</button>;
}

export function Card({title, children, action}) {
  return <div className="sismon-card p-4 md:p-5"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm uppercase tracking-wide text-[#1E1E1E]">{title}</h3>{action}</div>{children}</div>;
}

export function Input({label, ...props}) {
  return <label className="block text-sm"><span className="text-gray-600 text-xs font-medium">{label}</span><input {...props} className="sismon-input mt-1"/></label>;
}
export function Select({label, children, ...props}) {
  return <label className="block text-sm"><span className="text-gray-600 text-xs font-medium">{label}</span><select {...props} className="sismon-input mt-1">{children}</select></label>;
}
export function Textarea({label, ...props}) {
  return <label className="block text-sm"><span className="text-gray-600 text-xs font-medium">{label}</span><textarea {...props} className="sismon-input mt-1" rows={3}/></label>;
}

export function StatCard({num, ket}) {
  return <div className="sismon-card px-4 py-5 text-center">
    <div className="text-2xl md:text-3xl font-bold text-[#006122]">{num}</div>
    <div className="text-[11px] text-[#1E1E1E] mt-1 leading-tight">{ket}</div>
  </div>;
}

// Kartu grid gaya SAPUJAGAT: background gradien hijau/coklat, ikon outline putih besar, label di bawah
const grads = [
  "linear-gradient(135deg,#2e7d32,#1b5e20)",
  "linear-gradient(135deg,#00897b,#00695c)",
  "linear-gradient(135deg,#00796B,#004D40)",
  "linear-gradient(135deg,#388E3C,#2E7D32)",
  "linear-gradient(135deg,#00695C,#004D40)",
  "linear-gradient(135deg,#8D6E63,#5D4037)",
  "linear-gradient(135deg,#4E342E,#3E2723)",
  "linear-gradient(135deg,#007A33,#006122)",
];
export function MenuGrid({items}) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">{items.map(([icon,label,to],i)=> <a key={i} href={to} className="sapujagat-card" style={{background: grads[i % grads.length]}}>
    <div className="w-14 h-14 flex items-center justify-center text-white"><span className="text-3xl font-light">{icon}</span></div>
    <div className="text-white text-sm font-medium mt-2">{label}</div>
  </a>)}</div>;
}

// Kolom ramah-baca untuk export Excel pengajuan/izin
export function izinRows(list = []) {
  return list.map(x => ({
    "Tanggal": x.tanggal,
    "Jam Mulai": x.jam_mulai,
    "Siswa": x.siswa_nama,
    "Kelas": x.kelas || "-",
    "Kategori": x.kategori_nama,
    "Estimasi (mnt)": x.estimasi_menit,
    "Keperluan": x.keperluan,
    "Status": x.status,
    "Kode": x.kode || "-",
    "Catatan Piket": x.catatan_piket || "-",
    "Catatan BK": x.catatan_bk || "-",
    "Catatan Wali": x.catatan_wali || "-",
    "Keluar Aktual": x.waktu_keluar_aktual ? String(x.waktu_keluar_aktual).slice(0, 16).replace("T", " ") : "-",
    "Masuk Aktual": x.waktu_masuk_aktual ? String(x.waktu_masuk_aktual).slice(0, 16).replace("T", " ") : "-",
  }));
}

// Export data ke Excel (.xlsx) — SheetJS dimuat lazy saat export diklik
export async function exportXLSX(rows, filename = "laporan.xlsx", sheetName = "Data") {
  const XLSX = await import("xlsx");
  const skip = new Set(["lampiran", "foto"]); // data URL biner tidak layak masuk sel
  const clean = (rows || []).map(r => {
    const o = {};
    for (const [k, v] of Object.entries(r || {})) {
      if (skip.has(k)) continue;
      o[k] = typeof v === "string" && v.length > 500 ? v.slice(0, 500) + "…" : v;
    }
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(clean.length ? clean : [{}]);
  if (clean.length) {
    ws["!cols"] = Object.keys(clean[0]).map(key => ({
      wch: Math.min(Math.max(Math.max(String(key).length, ...clean.map(r => String(r[key] ?? "").length)) + 2, 10), 60),
    }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName).slice(0, 31));
  const name = String(filename).replace(/\.(csv|xls|xlsx)$/i, "") + ".xlsx";
  XLSX.writeFile(wb, name);
}
export function genKode() { return "IZN-" + Math.random().toString(36).slice(2,8).toUpperCase(); }
export function isTerlambat(item, batasMenit=15) {
  if (item.status!=="sudah_keluar") return false;
  const start = new Date(item.waktu_keluar_aktual || item.created_at);
  const limit = new Date(start.getTime() + (item.estimasi_menit||60)*60000 + batasMenit*60000);
  return new Date() > limit;
}
