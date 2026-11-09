import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";
import { StatusBadge, Card, Input, Select, Textarea, Button, exportXLSX, izinRows } from "../components/UI.jsx";
import { AdminHeader, ColorStat, GreenTable, Row, td } from "../components/AdminUI.jsx";
import { QRCodeSVG } from "qrcode.react";
import AuditModal from "../components/AuditModal.jsx";

export function SiswaDashboard(){
  const { user, pengajuan } = useApp();
  const mine = pengajuan.filter(x=>x.siswa_id===user.id);
  const aktif = mine.filter(x=>!["selesai","ditolak"].includes(x.status));
  const menungguKeluar = aktif.filter(x=>x.status==="menunggu_keluar").length;
  return <div className="space-y-5">
    <AdminHeader title="Dashboard Siswa" subtitle="Ringkasan dan notifikasi perizinan kamu" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ColorStat from="#007A33" to="#00A651" label="Izin Aktif" value={aktif.length} hint="Sedang berjalan"/>
      <ColorStat from="#2563eb" to="#1d4ed8" label="Total Izin" value={mine.length} hint="Pernah diajukan"/>
      <ColorStat from="#9333ea" to="#7e22ce" label="Menunggu Keluar" value={menungguKeluar} hint="Siap dipakai di gerbang"/>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link to="/siswa/ajukan" className="rounded-2xl p-5 text-white flex items-center justify-between transition-transform hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
        <div>
          <p className="text-[11px] uppercase tracking-widest opacity-80">Aksi Cepat</p>
          <p className="text-xl font-bold mt-1">+ Ajukan Izin Baru →</p>
          <p className="text-[11px] opacity-80 mt-1">Isi form pengajuan izin sekolah</p>
        </div>
        <span className="text-3xl">📝</span>
      </Link>
      <Link to="/siswa/kode" className="rounded-2xl p-5 text-white flex items-center justify-between transition-transform hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)"}}>
        <div>
          <p className="text-[11px] uppercase tracking-widest opacity-80">Gerbang Sekolah</p>
          <p className="text-xl font-bold mt-1">Kartu / Kode Izin QR →</p>
          <p className="text-[11px] opacity-80 mt-1">Tunjukkan kartu digital ke satpam</p>
        </div>
        <span className="text-3xl">🎫</span>
      </Link>
    </div>
    <GreenTable columns={["Tanggal & Jam","Kategori","Status"]} empty={mine.length===0 ? "Belum ada izin diajukan" : null}>
      {mine.slice(0,5).map(x=> <Row key={x.id}>
        <td className={td}>{x.tanggal} <span className="text-gray-400">{x.jam_mulai}</span></td>
        <td className={td}>{x.kategori_nama}</td>
        <td className={td}><StatusBadge status={x.status}/></td>
      </Row>)}
    </GreenTable>
  </div>;
}

export function AjukanIzin(){
  const { user, kategori, createPengajuan, settings } = useApp();
  const today = new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({ kategori_id:kategori[0]?.id||"", tanggal:today, jam_mulai:"09:00", estimasi_menit:60, keperluan:"", lampiran:"" });
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  // Auto-default estimasi_menit dari kategori yang dipilih
  useEffect(() => {
    const kat = kategori.find(k=>k.id===form.kategori_id);
    if (kat) setForm(fm=>({...fm, estimasi_menit:kat.maks_durasi_menit}));
  }, [form.kategori_id, kategori]);

  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 2*1024*1024) return setMsg("File lampiran max 2 MB");
    const r = new FileReader(); r.onload = () => setForm(fm => ({ ...fm, lampiran: r.result })); r.readAsDataURL(f);
  };
  const submit = async e=>{
    e.preventDefault();
    const kat = kategori.find(k=>k.id===form.kategori_id);
    if (!kat) return setMsg("Pilih kategori");
    // Validasi tanggal dengan Date object (robust)
    const inputDate = new Date(form.tanggal + 'T00:00:00');
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    if (inputDate < todayStart) return setMsg("Tanggal sudah lewat, sistem menolak otomatis");
    // Validasi jam sekolah efektif (workflow validasi waktu)
    const jamMasuk = settings.jam_masuk || "06:30"; const jamPulang = settings.jam_pulang || "16:00";
    const [jm, jmen] = form.jam_mulai.split(":").map(Number);
    const menit = jm*60 + jmen;
    const [im, imn] = jamMasuk.split(":").map(Number); const [pm, pmn] = jamPulang.split(":").map(Number);
    if (menit < im*60+imn || menit > pm*60+pmn) return setMsg(`Di luar jam sekolah efektif (${jamMasuk}-${jamPulang}), pengajuan ditolak otomatis`);
    const dur = Number(form.estimasi_menit);
    if (dur > kat.maks_durasi_menit) return setMsg(`Batas maksimal ${kat.maks_durasi_menit} menit untuk kategori ${kat.nama}`);
    setBusy(true);
    try {
      const item = await createPengajuan({ siswa_id:user.id, siswa_nama:user.nama, kelas:user.kelas||"", kategori_id:kat.id, kategori_nama:kat.nama, tanggal:form.tanggal, jam_mulai:form.jam_mulai, estimasi_menit:dur, keperluan:form.keperluan, lampiran:form.lampiran });
      setMsg(`Berhasil diajukan! ID ${item.id}. Menunggu verifikasi ${kat.verifikator==="bk"?"BK":"Piket"}.`);
    } catch (err) {
      setMsg("Gagal mengirim ke server: " + (err?.message || "coba lagi"));
    } finally {
      setBusy(false);
    }
  };
  return <div className="space-y-5">
    <AdminHeader title="Ajukan Izin Baru" subtitle="Isi formulir — sistem memvalidasi otomatis"/>
    <div className="rounded-2xl px-5 py-3 text-white text-xs sm:text-sm flex flex-wrap gap-x-6 gap-y-1" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
      <span>🕘 Jam efektif <b>{settings.jam_masuk||"06:30"} – {settings.jam_pulang||"16:00"}</b></span>
      <span>📅 Tanggal lewat ditolak</span>
      <span>⏱ Durasi mengikuti kategori</span>
    </div>
    <Card title="Form Pengajuan Izin">
      {msg && <div className="text-sm bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-xl mb-4">{msg}</div>}
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <Select label="Kategori Izin" value={form.kategori_id} onChange={e=>setForm({...form,kategori_id:e.target.value, estimasi_menit: kategori.find(k=>k.id===e.target.value)?.maks_durasi_menit||60})}>{kategori.map(k=> <option key={k.id} value={k.id}>{k.nama} (verifikator: {k.verifikator}, max {k.maks_durasi_menit} mnt)</option>)}</Select>
        <Input label="Tanggal" type="date" value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})} />
        <Input label="Jam Mulai" type="time" value={form.jam_mulai} onChange={e=>setForm({...form,jam_mulai:e.target.value})} />
        <Input label="Estimasi Lama (menit)" type="number" value={form.estimasi_menit} onChange={e=>setForm({...form,estimasi_menit:e.target.value})} />
        <div className="md:col-span-2"><Textarea label="Keperluan / Keterangan" value={form.keperluan} onChange={e=>setForm({...form,keperluan:e.target.value})} required /></div>
        <div className="md:col-span-2"><label className="block text-sm"><span className="text-gray-600">Upload Lampiran (opsional, max 2 MB)</span><input type="file" accept="image/*,.pdf" className="mt-1 w-full border rounded-lg px-3 py-2" onChange={handleFile}/></label>{form.lampiran && form.lampiran.startsWith("data:") && <p className="text-xs text-green-600 mt-1">✓ File terpilih</p>}</div>
        <div className="md:col-span-2"><Button disabled={busy} className="sismon-btn w-full disabled:opacity-60">{busy ? "Mengirim Pengajuan..." : "Ajukan Izin"}</Button></div>
      </form>
    </Card>
  </div>;
}

export function StatusIzin(){
  const { user, pengajuan } = useApp();
  const [auditId,setAuditId]=useState(null);
  const mine = pengajuan.filter(x=>x.siswa_id===user.id && !["selesai","ditolak"].includes(x.status));
  return <div className="space-y-5">{auditId && <AuditModal izinId={auditId} onClose={()=>setAuditId(null)}/>}
    <AdminHeader title="Status Izin Aktif" subtitle="Pantau progres pengajuanmu secara real-time"/>
    {mine.length===0 && <div className="sismon-card p-8 text-center"><p className="text-4xl mb-2">✅</p><p className="font-medium text-gray-600">Tidak ada izin aktif</p><p className="text-sm text-gray-400 mt-1">Pengajuan baru akan muncul di sini.</p></div>}
    {mine.map(x=> <div key={x.id} className="sismon-card p-4 md:p-5 border-l-4 border-l-[#007A33]">
      <div className="flex justify-between gap-2 flex-wrap"><b className="text-[#1E1E1E]">{x.kategori_nama}</b><div className="flex gap-2 items-center"><StatusBadge status={x.status}/><button className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-medium" onClick={()=>setAuditId(x.id)}>Audit Trail</button></div></div>
      <p className="text-sm text-gray-600 mt-1.5">{x.tanggal} · {x.jam_mulai} · {x.keperluan} · estimasi {x.estimasi_menit} menit</p>
      <p className="text-[11px] text-gray-400 mt-2">Alur: Diajukan → Diverifikasi Piket/BK → Diketahui Wali Kelas → Menunggu Keluar → Selesai</p>
      {x.kode && <div className="mt-2 inline-block bg-[#f0fdf4] border border-[#007A33]/20 rounded-xl p-3"><QRCodeSVG value={x.kode} size={120}/></div>}
      {x.lampiran?.startsWith("data:") && <div className="mt-2 text-xs"><a href={x.lampiran} download className="text-indigo-600 underline">Unduh lampiran</a></div>}
    </div>)}
  </div>;
}

export function RiwayatSiswa(){
  const { user, pengajuan } = useApp();
  const mine = pengajuan.filter(x=>x.siswa_id===user.id);
  return <div className="space-y-5">
    <AdminHeader title="Riwayat Izin" subtitle="Semua izin yang pernah kamu ajukan">
      <button onClick={()=>exportXLSX(izinRows(mine),"riwayat-siswa.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-3 py-2 whitespace-nowrap">⬇ Export Excel</button>
    </AdminHeader>
    <GreenTable columns={["Tanggal","Kategori","Status"]} empty={mine.length===0 ? "Belum ada riwayat" : null}>
      {mine.map(x=> <Row key={x.id}>
        <td className={td}>{x.tanggal}</td>
        <td className={td}>{x.kategori_nama}</td>
        <td className={td}><StatusBadge status={x.status}/></td>
      </Row>)}
    </GreenTable>
  </div>;
}

export function KodeIzin(){
  const { user, pengajuan } = useApp();
  const ready = pengajuan.filter(x=>x.siswa_id===user.id && x.kode && ["menunggu_keluar","sudah_keluar"].includes(x.status));
  return <div className="space-y-5">
    <AdminHeader title="Kartu / Kode Izin" subtitle="Tunjukkan QR ini di gerbang"/>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #print-container, #print-container * { visibility: visible !important; }
        #print-container { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0; }
        .no-print { display: none !important; }
        body { margin: 0; }
      }
    `}</style>
    {ready.length===0 && <div className="sismon-card p-8 text-center"><p className="text-4xl mb-2">🎫</p><p className="font-medium text-gray-600">Belum ada kartu aktif</p><p className="text-sm text-gray-400 mt-1">QR akan muncul setelah Wali Kelas menyetujui.</p></div>}
    <div id="print-container" className="grid md:grid-cols-2 gap-4">
      {ready.map(x=> <div key={x.id} className="kartu-print bg-white border border-[#007A33]/20 rounded-2xl overflow-hidden text-center shadow-sm break-inside-avoid">
        <div className="h-1.5 bg-gradient-to-r from-[#007A33] to-[#00A651]"/>
        <div className="p-6">
          <p className="font-bold tracking-wide text-[#007A33]">SURAT IZIN KELUAR MADRASAH</p>
          <p className="text-sm text-gray-600 mt-0.5">{x.siswa_nama} · {x.kelas}</p>
          <div className="flex justify-center my-4"><QRCodeSVG value={x.kode} size={180}/></div>
          <p className="font-mono font-bold text-lg text-[#1E1E1E]">{x.kode}</p>
          <p className="text-xs text-gray-400 mt-1">Berlaku {x.tanggal} · sekali pakai per sesi</p>
          <button onClick={()=>window.print()} className="no-print mt-4 bg-[#007A33] hover:bg-[#006122] text-white px-5 py-2.5 rounded-xl text-sm font-semibold">🖨 Print Kartu Izin</button>
        </div>
      </div>)}
    </div>
  </div>;
}
