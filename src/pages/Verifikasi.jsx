import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";
import { StatusBadge, Card, Button, exportXLSX, izinRows } from "../components/UI.jsx";
import { AdminHeader, ColorStat, GreenTable, Row, td } from "../components/AdminUI.jsx";
import QrScanner from "../components/QrScanner.jsx";

const initials = (n="?") => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("");

function SimpleTable({list, empty}){
  return <GreenTable columns={["Tanggal","Siswa","Kategori","Status"]} empty={empty || (list.length===0 ? "Belum ada data" : null)}>
    {list.map(x=> <Row key={x.id}>
      <td className={td}>{x.tanggal}</td>
      <td className={td}><span className="font-medium">{x.siswa_nama}</span><br/><span className="text-xs text-gray-500">{x.kelas}</span></td>
      <td className={td}>{x.kategori_nama}</td>
      <td className={td}><StatusBadge status={x.status}/></td>
    </Row>)}
  </GreenTable>;
}

function VerifyList({title, subtitle, list, catatan, setCatatan, act, accent}){
  return <div className="space-y-5">
    <AdminHeader title={title} subtitle={subtitle}>
      {list.length>0 && <span className="btn-pill bg-white/15 border border-white/25 text-white text-xs px-3 py-2">{list.length} menunggu</span>}
    </AdminHeader>
    {list.length===0 && <div className="sismon-card p-8 text-center"><p className="text-4xl mb-2">✅</p><p className="font-medium text-gray-600">Antrean kosong</p><p className="text-sm text-gray-400 mt-1">Semua pengajuan sudah diproses.</p></div>}
    {list.map(x=> <div key={x.id} className="sismon-card p-4 md:p-5 border-l-4" style={{borderLeftColor:accent}}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0" style={{background:accent}}>{initials(x.siswa_nama)}</div>
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[#1E1E1E]">{x.siswa_nama}</b>
            <span className="text-xs text-gray-500">({x.kelas})</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{x.kategori_nama}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{x.tanggal} · {x.jam_mulai} · estimasi {x.estimasi_menit} menit</p>
          <p className="text-sm text-gray-700 mt-1"><span className="text-gray-400">Keperluan:</span> {x.keperluan}</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input className="border rounded-lg px-3 py-2 flex-1 text-sm" placeholder="Catatan (opsional)" value={catatan[x.id]||""} onChange={e=>setCatatan({...catatan,[x.id]:e.target.value})}/>
            <div className="flex gap-2">
              <button className="bg-[#007A33] hover:bg-[#006122] transition text-white px-5 py-2 rounded-xl text-sm font-semibold" onClick={()=>act(x.id,true)}>Setujui</button>
              <button className="bg-[#D00000] hover:bg-[#a80000] transition text-white px-5 py-2 rounded-xl text-sm font-semibold" onClick={()=>act(x.id,false)}>Tolak</button>
            </div>
          </div>
        </div>
      </div>
    </div>)}
  </div>;
}

function useVerify(role){
  const { kategori, pengajuan, updateStatus } = useApp();
  const list = pengajuan.filter(x=> {
    const kat = kategori.find(k=>k.id===x.kategori_id);
    return x.status==="diajukan" && kat?.verifikator===role;
  });
  return { list, updateStatus, pengajuan };
}

export function PiketDashboard(){
  const { pengajuan } = useApp();
  const count = pengajuan.filter(x=>x.status==="diajukan").length;
  return <div className="space-y-5">
    <AdminHeader title="Dashboard Petugas Piket" subtitle="Verifikasi izin siswa yang masuk hari ini"/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ColorStat from="#f59e0b" to="#d97706" label="Menunggu Verifikasi" value={count} hint="Pengajuan masuk"/>
      <Link to="/piket/verifikasi" className="rounded-2xl p-5 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
        <div><p className="text-[11px] uppercase tracking-widest opacity-80">Aksi Cepat</p><p className="text-xl font-bold mt-1">Proses Antrean →</p></div>
        <p className="text-[11px] opacity-80 mt-3">Buka daftar verifikasi sekarang</p>
      </Link>
    </div>
  </div>;
}
export function PiketVerify(){
  const { list, updateStatus } = useVerify("piket");
  const [catatan,setCatatan]=useState({});
  const act = (id,ok)=> updateStatus(id, ok? {status:"diverifikasi_piket_bk", catatan_piket:catatan[id]||"Disetujui"} : {status:"ditolak", catatan_piket:catatan[id]||"Ditolak"});
  return <VerifyList title="Verifikasi Izin — Piket" subtitle="Izin dengan verifikator Piket" list={list} catatan={catatan} setCatatan={setCatatan} act={act} accent="#2563eb"/>;
}
export function PiketRiwayat(){
  const { pengajuan } = useApp();
  const list = pengajuan.filter(x=>x.catatan_piket || ["diverifikasi_piket_bk","disetujui_wali_kelas","menunggu_keluar","sudah_keluar","selesai","ditolak"].includes(x.status));
  return <div className="space-y-5">
    <AdminHeader title="Riwayat Verifikasi Piket" subtitle="Izin yang pernah kamu proses">
      <button onClick={()=>exportXLSX(izinRows(list),"riwayat-piket.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-3 py-2 whitespace-nowrap">⬇ Export Excel</button>
    </AdminHeader>
    <SimpleTable list={list}/>
  </div>;
}
export function BKVerify(){
  const { list, updateStatus } = useVerify("bk");
  const [catatan,setCatatan]=useState({});
  const act = (id,ok)=> updateStatus(id, ok? {status:"diverifikasi_piket_bk", catatan_bk:catatan[id]||"Disetujui"} : {status:"ditolak", catatan_bk:catatan[id]||"Ditolak"});
  return <VerifyList title="Verifikasi Izin — BK" subtitle="Izin dengan verifikator BK (Bimbingan Konseling)" list={list} catatan={catatan} setCatatan={setCatatan} act={act} accent="#9333ea"/>;
}
export function BKHistori(){
  const { pengajuan } = useApp();
  const map = {}; pengajuan.forEach(x=>{ map[x.siswa_nama]=(map[x.siswa_nama]||0)+1 });
  const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(1, ...entries.map(([,c])=>c));
  const unik = entries.length;
  return <div className="space-y-5">
    <AdminHeader title="Histori & Deteksi Pola" subtitle="Frekuensi izin per siswa — pantau pola berulang"/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ColorStat from="#9333ea" to="#7e22ce" label="Siswa Unik" value={unik} hint="Pernah mengajukan izin"/>
      <ColorStat from="#2563eb" to="#1d4ed8" label="Total Pengajuan" value={pengajuan.length} hint="Seluruh data tercatat"/>
    </div>
    <div className="sismon-card p-4 md:p-5 space-y-3">
      {entries.length===0 && <p className="text-sm text-gray-500">Belum ada data</p>}
      {entries.map(([n,c])=> <div key={n}>
        <div className="flex justify-between text-xs mb-1"><span className="font-medium">{n}</span><b>{c}×</b></div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full rounded-full" style={{width:(c/max*100)+"%", background:"linear-gradient(90deg,#9333ea,#c084fc)"}}/></div>
      </div>)}
    </div>
  </div>;
}
export function BKRiwayat(){
  const { pengajuan } = useApp();
  const list = pengajuan.filter(x=>x.catatan_bk);
  return <div className="space-y-5">
    <AdminHeader title="Riwayat Verifikasi BK" subtitle="Izin yang pernah diverifikasi BK">
      <button onClick={()=>exportXLSX(izinRows(list),"riwayat-bk.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-3 py-2 whitespace-nowrap">⬇ Export Excel</button>
    </AdminHeader>
    <SimpleTable list={list}/>
  </div>;
}
// Kelas efektif wali: ambil dari user.kelas, atau dari kelas yang diampu (menu Kelas & Wali)
const waliKelasOf = (user, kelas) => (kelas.find(k => k.wali_kelas_id === user?.id)?.nama) || user?.kelas || "";

export function WaliDashboard(){
  const { pengajuan, user, kelas } = useApp();
  const myKelas = waliKelasOf(user, kelas);
  const list = pengajuan.filter(x=>x.status==="diverifikasi_piket_bk" && (!myKelas || x.kelas===myKelas));
  return <div className="space-y-5">
    <AdminHeader title="Dashboard Wali Kelas" subtitle={myKelas ? `RBAC: hanya ${myKelas}` : "Semua kelas (belum ada penugasan kelas)"}/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ColorStat from="#2563eb" to="#1d4ed8" label="Menunggu Approval" value={list.length} hint="Lolos Piket/BK"/>
      <Link to="/wali/verifikasi" className="rounded-2xl p-5 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
        <div><p className="text-[11px] uppercase tracking-widest opacity-80">Aksi Cepat</p><p className="text-xl font-bold mt-1">Beri Approval →</p></div>
        <p className="text-[11px] opacity-80 mt-3">Izin hanya tampil untuk kelasmu</p>
      </Link>
    </div>
  </div>;
}
export function WaliVerify(){
  const { pengajuan, updateStatus, user, kelas } = useApp();
  const [catatan,setCatatan]=useState({});
  const myKelas = waliKelasOf(user, kelas);

  // Tahap 1: Belum disetujui wali → tombol "Setujui" (status: disetujui_wali_kelas)
  const listBelum = pengajuan.filter(x=>x.status==="diverifikasi_piket_bk" && (!myKelas || x.kelas===myKelas));
  // Tahap 2: Sudah disetujui wali, belum terbit kode → tombol "Terbitkan Kode Izin" (status: menunggu_keluar)
  const listSiapKode = pengajuan.filter(x=>x.status==="disetujui_wali_kelas" && (!myKelas || x.kelas===myKelas));

  const setujui = async (id) => {
    await updateStatus(id, {status:"disetujui_wali_kelas", catatan_wali:catatan[id]||"Disetujui"});
  };
  const terbitkanKode = async (id) => {
    // Kode sekarang dihasilkan server, client hanya minta ubah status ke menunggu_keluar
    await updateStatus(id, {status:"menunggu_keluar"});
  };
  const tolak = (id) => updateStatus(id,{status:"ditolak", catatan_wali:catatan[id]||"Ditolak"});

  return <div className="space-y-5">
    <AdminHeader title={`Approval Wali Kelas${myKelas ? ` — ${myKelas}` : ""}`} subtitle="Tahap 1: Setujui (menjadi Disetujui Wali Kelas) → Tahap 2: Terbitkan Kode Izin (siap dipakai di gerbang)">
      {(listBelum.length+listSiapKode.length>0) && <span className="btn-pill bg-white/15 border border-white/25 text-white text-xs px-3 py-2">{listBelum.length+listSiapKode.length} menunggu</span>}
    </AdminHeader>

    {/* Tahap 1: Setujui */}
    {listBelum.length>0 && (
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider mb-1">Tahap 1 — Belum disetujui Wali Kelas</h4>
        <div className="space-y-2">
          {listBelum.map(x=> <div key={x.id} className="sismon-card p-3 md:p-4 border-l-4 border-[#4f46e5]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0" style={{background:"#4f46e5"}}>{initials(x.siswa_nama)}</div>
              <div className="min-w-0 grow">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <b className="text-[#1E1E1E] text-sm">{x.siswa_nama}</b>
                  <span className="text-xs text-gray-500">({x.kelas})</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{x.kategori_nama}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{x.tanggal} · {x.jam_mulai} · estimasi {x.estimasi_menit} menit</p>
                <p className="text-xs text-gray-700 mb-2"><span className="text-gray-400">Keperluan:</span> {x.keperluan}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className="border rounded-lg px-3 py-2 text-sm flex-1" placeholder="Catatan (opsional)" value={catatan[x.id]||""} onChange={e=>setCatatan({...catatan,[x.id]:e.target.value})}/>
                  <button onClick={()=>setujui(x.id)} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-4 py-2 rounded-xl text-xs font-semibold">Setujui</button>
                  <button onClick={()=>tolak(x.id)} className="bg-[#D00000] hover:bg-[#a80000] text-white px-4 py-2 rounded-xl text-xs font-semibold">Tolak</button>
                </div>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    )}

    {/* Tahap 2: Terbitkan Kode */}
    {listSiapKode.length>0 && (
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#007A33] uppercase tracking-wider mb-1">Tahap 2 — Sudah Disetujui, Belum Terbit Kode</h4>
        <div className="space-y-2">
          {listSiapKode.map(x=> <div key={x.id} className="sismon-card p-3 md:p-4 border-l-4 border-[#007A33]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0" style={{background:"#007A33"}}>{initials(x.siswa_nama)}</div>
              <div className="min-w-0 grow">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <b className="text-[#1E1E1E] text-sm">{x.siswa_nama}</b>
                  <span className="text-xs text-gray-500">({x.kelas})</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#006122]">Disetujui Wali</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{x.tanggal} · {x.jam_mulai} · estimasi {x.estimasi_menit} menit</p>
                <p className="text-xs text-gray-700 mb-2"><span className="text-gray-400">Catatan:</span> {x.catatan_wali||"-"}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={()=>terbitkanKode(x.id)} className="bg-[#007A33] hover:bg-[#006122] text-white px-4 py-2 rounded-xl text-xs font-semibold">🎫 Terbitkan Kode Izin</button>
                  <button onClick={()=>tolak(x.id)} className="bg-[#D00000] hover:bg-[#a80000] text-white px-4 py-2 rounded-xl text-xs font-semibold">Batalkan/Tolak</button>
                </div>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    )}

    {listBelum.length===0 && listSiapKode.length===0 && (
      <div className="sismon-card p-8 text-center"><p className="text-4xl mb-2">✅</p><p className="font-medium text-gray-600">Antrean kosong</p><p className="text-sm text-gray-400 mt-1">Semua pengajuan untuk kelasmu sudah diproses.</p></div>
    )}
  </div>;
}
export function WaliRekap(){
  const { pengajuan, user, kelas } = useApp();
  const myKelas = waliKelasOf(user, kelas);
  const list = pengajuan.filter(x=>!myKelas || x.kelas===myKelas);
  return <div className="space-y-5">
    <AdminHeader title="Rekap Izin Kelas" subtitle={myKelas ? `Kelas ${myKelas}` : "Semua kelas"}>
      <button onClick={()=>exportXLSX(izinRows(list),"rekap-wali.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-3 py-2 whitespace-nowrap">⬇ Export Excel</button>
    </AdminHeader>
    <SimpleTable list={list}/>
  </div>;
}
export function WaliRiwayat(){
  const { pengajuan, user, kelas } = useApp();
  const myKelas = waliKelasOf(user, kelas);
  const list = pengajuan.filter(x=>x.catatan_wali && (!myKelas || x.kelas===myKelas));
  return <div className="space-y-5">
    <AdminHeader title="Riwayat Wali Kelas" subtitle="Izin yang pernah kamu ketahui/setujui"/>
    <SimpleTable list={list}/>
  </div>;
}
export function SatpamDashboard(){
  const { pengajuan } = useApp();
  const ready = pengajuan.filter(x=>x.status==="menunggu_keluar");
  const keluar = pengajuan.filter(x=>x.status==="sudah_keluar");
  return <div className="space-y-5">
    <AdminHeader title="Dashboard Satpam" subtitle="Verifikasi keluar & masuk siswa di gerbang"/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ColorStat from="#9333ea" to="#7e22ce" label="Siap Keluar" value={ready.length} hint="Disetujui & menunggu scan"/>
      <ColorStat from="#ea580c" to="#f97316" label="Belum Kembali" value={keluar.length} hint="Sudah keluar, belum kembali"/>
    </div>
    <Link to="/satpam/scan" className="rounded-2xl p-5 text-white flex items-center justify-between gap-4 transition-transform hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
      <div><p className="text-[11px] uppercase tracking-widest opacity-80">Aksi Cepat</p><p className="text-xl font-bold mt-1">Buka Scan Gerbang →</p><p className="text-[11px] opacity-80 mt-1">Scan QR atau input kode manual</p></div>
      <span className="text-4xl">📷</span>
    </Link>
  </div>;
}
export function SatpamScan(){
  const { users, scanKode } = useApp();
  const [kode,setKode]=useState(""); const [msg,setMsg]=useState(""); const [found,setFound]=useState(null); const [ok,setOk]=useState(null); const [busy,setBusy]=useState(false);
  const doScan = async (code) => {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) return;
    setKode(clean);
    setBusy(true);
    try {
      const r = await scanKode(clean);
      if (!r.ok) { setMsg(r.data?.error || 'Gagal verifikasi'); setOk(false); setFound(null); setBusy(false); return; }
      const data = r.data;
      const item = data.item;
      const siswa = users.find(u => u.id === item.siswa_id);
      setFound({ item, siswa });
      setOk(true);
      setMsg(data.outcome === 'keluar'
        ? `Keluar tercatat: ${item.siswa_nama} (${siswa?.kelas||item.kelas}) — ${new Date(item.waktu_keluar_aktual).toLocaleTimeString("id-ID")}`
        : `Masuk kembali tercatat: ${item.siswa_nama} — status Selesai`);
    } catch {
      setMsg('Gagal terhubung ke server'); setOk(false); setFound(null);
    }
    setBusy(false);
  };
  const scan=()=> doScan(kode);
  return <div className="space-y-5">
    <AdminHeader title="Scan Gerbang" subtitle="Scan QR / input kode izin siswa"/>
    {msg && <div className={`text-sm p-3 rounded-xl border ${ok ? "bg-[#f0fdf4] border-[#007A33]/25 text-[#006122]" : "bg-red-50 border-red-200 text-red-700"}`}>{ok ? "✓ " : "✗ "}{msg}</div>}
    {found && <div className="sismon-card p-4 md:p-5 flex items-center gap-4 border-l-4 border-l-[#007A33]"><img src={found.siswa?.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.item.siswa_nama)}&background=006122&color=fff`} alt="foto siswa" style={{width:80,height:80,objectFit:"cover",borderRadius:999}}/><div className="min-w-0"><b className="text-[#1E1E1E]">{found.item.siswa_nama}</b> <span className="text-sm text-gray-500">· {found.item.kelas}</span><br/><span className="text-xs text-gray-500">{found.item.kategori_nama} · <span className="font-mono">{found.item.kode}</span></span></div></div>}
    <Card title="Kamera / Input Kode">
      <QrScanner onRead={doScan}/>
      <div className="flex gap-2 mt-3"><input className="border rounded-lg px-3 py-2 flex-1 text-sm" placeholder="Input kode IZN-XXXXXX atau scan QR" value={kode} onChange={e=>setKode(e.target.value)} onKeyDown={e=>e.key==="Enter" && !busy && scan()}/><Button onClick={scan} disabled={busy} className="sismon-btn sm:w-auto px-6 disabled:opacity-60">{busy ? "Memproses..." : "Verifikasi"}</Button></div>
    </Card>
  </div>;
}
export function SatpamBelumKembali(){
  const { pengajuan, settings, sendNotification } = useApp();
  const batas = Number(settings.batasTerlambatMenit || 15);
  const terlambatOf = (x) => new Date() > new Date(new Date(x.waktu_keluar_aktual).getTime() + (x.estimasi_menit||60)*60000 + batas*60000);
  const list = pengajuan.filter(x=>x.status==="sudah_keluar");
  const terlambat = list.filter(terlambatOf).length;
  const [notifStatus,setNotifStatus]=useState({});
  const kirimNotif = async (id) => {
    setNotifStatus({...notifStatus,[id]:'loading'});
    const r = await sendNotification(id, 'Wali Kelas / BK / Orang Tua');
    setNotifStatus({...notifStatus,[id]: r.ok ? 'terkirim' : 'gagal'});
    if (r.ok) alert('Notifikasi terlambat tercatat.'); else alert(r.data?.error || 'Gagal mengirim notifikasi');
  };
  return <div className="space-y-5">
    <AdminHeader title="Siswa Belum Kembali" subtitle={`Alert terlambat setelah estimasi + ${batas} menit`}/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ColorStat from="#ea580c" to="#f97316" label="Belum Kembali" value={list.length} hint="Masih di luar"/>
      <ColorStat from="#D00000" to="#b91c1c" label="Terlambat" value={terlambat} hint="Lewat batas estimasi + toleransi"/>
    </div>
    <GreenTable columns={["Siswa","Kode","Keluar","Status","Aksi"]} empty={list.length===0 ? "Semua siswa sudah kembali 🎉" : null}>
      {list.map(x=> { const t = terlambatOf(x); return <Row key={x.id}>
        <td className={td}><span className="font-medium">{x.siswa_nama}</span><br/><span className="text-xs text-gray-500">{x.kelas}</span></td>
        <td className={td}><span className="font-mono text-xs">{x.kode}</span></td>
        <td className={td}>{x.waktu_keluar_aktual?.slice(0,16)}</td>
        <td className={td}>{t
          ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">TERLAMBAT</span>
          : <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Belum kembali</span>}</td>
        <td className={td}>
          {t && notifStatus[x.id] !== 'terkirim'
            ? <button onClick={()=>kirimNotif(x.id)} disabled={notifStatus[x.id]==='loading'} className="text-[10px] bg-[#007A33] text-white px-2 py-1 rounded hover:bg-[#006122] disabled:opacity-50">{notifStatus[x.id]==='loading'?'Kirim...':'Kirim Notif'}</button>
            : notifStatus[x.id] === 'terkirim'
              ? <span className="text-[10px] text-green-600 font-medium">✓ Terkirim</span>
              : <span className="text-[10px] text-gray-400">-</span>}</td>
      </Row>;})}
    </GreenTable>
    <p className="text-[11px] text-gray-400">Siswa TERLAMBAT dapat diberi notifikasi ke Wali Kelas / BK / orang tua (dicatat di audit trail).</p>
  </div>;
}
