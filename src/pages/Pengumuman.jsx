import { useState } from "react";
import { useApp } from "../store/AppContext.jsx";
import { Input, Textarea, Button } from "../components/UI.jsx";
import { AdminHeader, Modal } from "../components/AdminUI.jsx";

const FALLBACK = [
  { id:"f1", tanggal:"04 November 2026", judul:"Sistem Perizinan Siswa SISMEN v2.0 Resmi Diluncurkan", desc:"Assalamu'alaikum warahmatullahi wabarakatuh, Sehubungan dengan digitalisasi..." },
  { id:"f2", tanggal:"03 November 2026", judul:"Jadwal Jam Sekolah Semester Genap 2026/2027", desc:"Disampaikan kepada seluruh siswa dan orang tua bahwa jam masuk..." },
  { id:"f3", tanggal:"01 November 2026", judul:"Pendaftaran Beasiswa Cendekia Baznas Dalam Negeri Tahun 2026", desc:"Disampaikan dengan hormat, dalam rangka meningkatkan akses..." },
];

const STRIPS = [
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-lime-400 to-green-600",
];
const CHIPS = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "bg-lime-50 text-lime-700 border-lime-200",
];

const todayId = () => new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});

export function PengumumanPage(){
  const { user, pengumuman, savePengumuman, deletePengumuman, resetPengumuman, online } = useApp();
  const canCreate = ["admin","wali_kelas","bk"].includes(user.role);
  const list = online ? (pengumuman || []) : (pengumuman?.length ? pengumuman : FALLBACK);
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({ judul:"", desc:"", tanggal:todayId() });
  const [busy,setBusy]=useState(false);

  const openAdd = () => { setEditItem(null); setForm({judul:"",desc:"",tanggal:todayId()}); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({judul:p.judul, desc:p.desc, tanggal:p.tanggal}); setShowModal(true); };
  const save = async e => {
    e.preventDefault();
    setBusy(true);
    const r = await savePengumuman(editItem?.id ?? null, { judul: form.judul.trim(), desc: form.desc.trim(), tanggal: form.tanggal });
    setBusy(false);
    if (!r.ok) return alert(r.error || "Gagal menyimpan");
    setShowModal(false);
  };
  const remove = async id => { if(!confirm("Hapus pengumuman ini?")) return; const r = await deletePengumuman(id); if (!r.ok) alert(r.error || "Gagal menghapus"); };
  const reset = async () => { if(!confirm("Reset ke pengumuman awal?")) return; await resetPengumuman(); };

  return <div className="space-y-5">
    <AdminHeader title="Pengumuman" subtitle={online ? "Informasi resmi dari madrasah" : "Mode offline — tersimpan lokal di perangkat ini"}>
      {canCreate && <>
        {!online && <button onClick={reset} className="btn-pill border border-white/40 text-white hover:bg-white/10 transition-all text-xs px-3 py-2 whitespace-nowrap">Reset awal</button>}
        <button onClick={openAdd} className="btn-pill bg-violet-500 text-white shadow-md hover:bg-violet-600 transition-all text-xs px-3 py-2 whitespace-nowrap">+ Buat Pengumuman</button>
      </>}
    </AdminHeader>

    {list.length===0 && (
      <div className="sismon-card p-8 text-center">
        <p className="text-4xl mb-2">📭</p>
        <p className="font-medium text-gray-600">Belum ada pengumuman</p>
        {canCreate && <p className="text-sm text-gray-400 mt-1">Klik “+ Buat Pengumuman” untuk menambahkan.</p>}
      </div>
    )}

    <div className="grid md:grid-cols-2 gap-4">
      {list.map((p,i)=> { const strip = STRIPS[i%STRIPS.length]; const chip = CHIPS[i%CHIPS.length]; return (
        <article key={p.id} className="rounded-2xl overflow-hidden bg-white border border-[#007A33]/15 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className={`h-1.5 bg-gradient-to-r ${strip}`} />
          <div className="p-4 flex flex-col gap-2 grow">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${chip}`}>📅 {p.tanggal}</span>
              {canCreate && <div className="flex items-center gap-3 shrink-0">
                <button onClick={()=>openEdit(p)} className="text-xs font-medium text-[#007A33] hover:underline">Edit</button>
                <button onClick={()=>remove(p.id)} className="text-xs font-medium text-[#b91c1c] hover:underline">Hapus</button>
              </div>}
            </div>
            <h3 className="font-bold leading-snug text-[#1E1E1E]">{p.judul}</h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{p.desc}</p>
          </div>
        </article>
      );})}
    </div>

    {showModal && <Modal title={editItem ? "Edit Pengumuman" : "Buat Pengumuman"} subtitle={online ? "Tampil ke semua pengguna" : "Mode offline — hanya tersimpan di perangkat ini"} onClose={()=>setShowModal(false)}>
      <form onSubmit={save} className="space-y-4">
        <Input label="Judul" value={form.judul} onChange={e=>setForm({...form,judul:e.target.value})} placeholder="Judul pengumuman" required/>
        <Input label="Tanggal" value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})}/>
        <Textarea label="Isi / Deskripsi" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} required/>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 border border-[rgba(15,23,42,0.12)] rounded-xl text-sm text-[#475569] font-medium hover:bg-gray-50 transition">Batal</button>
          <Button className="flex-1 sismon-btn sm:w-auto px-6">{busy ? "Menyimpan..." : editItem ? "Simpan Perubahan" : "Publikasikan"}</Button>
        </div>
      </form>
    </Modal>}
  </div>;
}
