import { useState, useMemo } from "react";
import { useApp } from "../store/AppContext.jsx";
import { Card, Button, Input, Select, StatusBadge, exportXLSX, izinRows } from "../components/UI.jsx";
import { AdminHeader, ColorStat, Modal, GreenTable, Row, td, modalActions } from "../components/AdminUI.jsx";

export function AdminDashboard(){
  const { pengajuan = [], users = [], kategori = [] } = useApp();
  const statusColors = { diajukan:"#FFA500", diverifikasi_piket_bk:"#2563eb", disetujui_wali_kelas:"#6366f1", menunggu_keluar:"#9333ea", sudah_keluar:"#ea580c", selesai:"#008000", ditolak:"#D00000" };
  const statusLabels = { diajukan:"Diajukan", diverifikasi_piket_bk:"Diverifikasi Piket/BK", disetujui_wali_kelas:"Disetujui Wali Kelas", menunggu_keluar:"Menunggu Keluar", sudah_keluar:"Sudah Keluar", selesai:"Selesai", ditolak:"Ditolak" };
  const byStatus = Object.entries((pengajuan || []).reduce((acc,p)=>{ acc[p.status]=(acc[p.status]||0)+1; return acc; },{}));
  const maxStatus = Math.max(1, ...byStatus.map(([,c])=>c));
  const byKategori = Object.entries((pengajuan || []).reduce((acc,p)=>{ acc[p.kategori_nama]=(acc[p.kategori_nama]||0)+1; return acc; },{}));
  const maxKat = Math.max(1, ...byKategori.map(([,c])=>c));
  const catColors = ["#FF6B6B","#4ECDC4","#FFE66D","#95E1D3","#F38181","#AA96DA","#007A33","#006122"];
  return <div className="space-y-5">
    {/* KARTU WARNA-WARNI */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}><p className="text-xs uppercase tracking-widest opacity-80">Total Pengajuan</p><p className="text-4xl font-bold mt-1">{pengajuan.length}</p><p className="text-xs opacity-80 mt-1">Semua pengajuan izin</p></div>
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)"}}><p className="text-xs uppercase tracking-widest opacity-80">Total User</p><p className="text-4xl font-bold mt-1">{users.length}</p><p className="text-xs opacity-80 mt-1">Siswa + guru + staff</p></div>
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#ea580c,#f97316)"}}><p className="text-xs uppercase tracking-widest opacity-80">Kategori Izin</p><p className="text-4xl font-bold mt-1">{kategori.length}</p><p className="text-xs opacity-80 mt-1">Jenis izin terdaftar</p></div>
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#9333ea,#7e22ce)"}}><p className="text-xs uppercase tracking-widest opacity-80">Selesai</p><p className="text-4xl font-bold mt-1">{pengajuan.filter(p=>p.status==="selesai").length}</p><p className="text-xs opacity-80 mt-1">Izin tuntas kembali</p></div>
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#D00000,#b91c1c)"}}><p className="text-xs uppercase tracking-widest opacity-80">Ditolak</p><p className="text-4xl font-bold mt-1">{pengajuan.filter(p=>p.status==="ditolak").length}</p><p className="text-xs opacity-80 mt-1">Tidak disetujui</p></div>
      <div className="rounded-2xl p-5 text-white" style={{background:"linear-gradient(135deg,#0f766e,#134e4a)"}}><p className="text-xs uppercase tracking-widest opacity-80">Sudah Keluar</p><p className="text-4xl font-bold mt-1">{pengajuan.filter(p=>p.status==="sudah_keluar").length}</p><p className="text-xs opacity-80 mt-1">Belum kembali</p></div>
    </div>

    {/* REKAP DENGAN GRAFIK */}
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Rekap per Status (Bar Chart)">
        <div className="space-y-3">{byStatus.length===0 && <p className="text-sm text-gray-500">Belum ada data</p>}{byStatus.map(([s,c])=> <div key={s}><div className="flex justify-between text-xs mb-1"><span>{statusLabels[s]||s}</span><b>{c}</b></div><div className="bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full" style={{width:(c/maxStatus*100)+"%", background: statusColors[s]||"#333"}}/></div></div>)}</div>
      </Card>
      <Card title="Rekap per Kategori (Pie / Donut warna-warni)">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0"><circle cx="50" cy="50" r="40" fill="none" stroke="#eee" strokeWidth="18"/>{(()=>{ let offset=25; const total=pengajuan.length||1; return byKategori.map(([name,c],i)=>{ const pct=c/total; const dash=pct*251.2; const el=<circle key={name} cx="50" cy="50" r="40" fill="none" stroke={catColors[i%catColors.length]} strokeWidth="18" strokeDasharray={`${dash} 251.2`} strokeDashoffset={offset} transform="rotate(-90 50 50)"/>; offset-=dash; return el; })} )()}<text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1E1E1E">{pengajuan.length}</text><text x="50" y="60" textAnchor="middle" fontSize="8" fill="#777">Total</text></svg>
          <div className="space-y-1 text-xs flex-1">{byKategori.map(([n,c],i)=> <div key={n} className="flex justify-between"><span><span className="inline-block w-3 h-3 rounded-full mr-2" style={{background:catColors[i%catColors.length]}}/>{n}</span><b>{c}</b></div>)}</div>
        </div>
      </Card>
    </div>

    <Card title="Rekap Pengajuan Terbaru">
      <div className="table-wrap"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-2">Tanggal</th><th>Siswa</th><th>Kategori</th><th>Status</th><th>Kode</th></tr></thead><tbody>{pengajuan.slice(0,8).map(p=> <tr key={p.id} className="border-b"><td className="p-2">{p.tanggal}</td><td>{p.siswa_nama}</td><td>{p.kategori_nama}</td><td><span className="text-xs px-2 py-1 rounded-full text-white" style={{background:statusColors[p.status]||"#666"}}>{statusLabels[p.status]||p.status}</span></td><td>{p.kode||"-"}</td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}
export function AdminUser(){
  const { users, user: me, createUser, updateUser, deleteUsers, importUsers, kelas } = useApp();
  const needsKelas = (role) => role === 'siswa' || role === 'wali_kelas';
  const waliOf = (id) => users.find(u => u.id === id)?.nama;
  const kelasOptions = <>
    <option value="">Pilih kelas...</option>
    {kelas.map(k => <option key={k.id} value={k.nama}>{k.nama} — Wali: {waliOf(k.wali_kelas_id) || 'belum ditugaskan'}</option>)}
  </>;
  const [form,setForm]=useState({username:"",nis:"",password:"1234",nama:"",role:"siswa",kelas:"",status:"aktif"});
  const [showModal,setShowModal]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [editForm,setEditForm]=useState({username:"",nis:"",password:"",nama:"",role:"siswa",kelas:""});
  const [showEditModal,setShowEditModal]=useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState("username");
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [searchName, setSearchName] = useState("");

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const selectAll = (checked) => {
    if (checked) setSelectedIds(new Set(users.map(u=>u.id)));
    else setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (!confirm(`Hapus ${selectedIds.size} user terpilih?`)) return;
    const r = await deleteUsers([...selectedIds]);
    if (!r.ok) return alert(r.error);
    if (r.blocked?.length) alert(r.blocked.join("\n"));
    setSelectedIds(new Set());
  };

  const deleteByRole = async (role) => {
    if (!role) return;
    if (!confirm(`Hapus SEMUA user dengan role "${role}"?`)) return;
    const ids = users.filter(u => u.role === role).map(u => u.id);
    const r = await deleteUsers(ids);
    if (!r.ok) return alert(r.error);
    if (r.blocked?.length) alert(r.blocked.join("\n"));
    setSelectedIds(new Set());
  };

  const deleteOne = async (u) => {
    if (!confirm(`Hapus user "${u.nama}" (${u.username})?`)) return;
    const r = await deleteUsers([u.id]);
    if (!r.ok) return alert(r.error);
    if (r.blocked?.length) alert(r.blocked.join("\n"));
  };

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
  };

  const sortedUsers = useMemo(()=> {
    return [...users]
      .filter(u => u.nama.toLowerCase().includes(searchName.toLowerCase()) || u.username.toLowerCase().includes(searchName.toLowerCase()))
      .sort((a,b)=> {
        let va = a[sortBy] || "";
        let vb = b[sortBy] || "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [users, searchName, sortBy, sortDir]);

  const roleColors = {
    siswa:"bg-blue-50 text-blue-700 border-blue-200",
    piket:"bg-green-50 text-green-700 border-green-200",
    bk:"bg-purple-50 text-purple-700 border-purple-200",
    wali_kelas:"bg-indigo-50 text-indigo-700 border-indigo-200",
    satpam:"bg-orange-50 text-orange-700 border-orange-200",
    admin:"bg-red-50 text-red-700 border-red-200",
  };

  const add=async e=>{
    e.preventDefault();
    const username = form.username.trim();
    const nis = form.nis.trim() || username; // NIS default ke username jika kosong
    if (users.some(u=>u.username===username)) return alert("Username/NIS sudah terdaftar.");
    const kelasValue = needsKelas(form.role) ? form.kelas : "";
    if (form.role === 'siswa' && !kelasValue) return alert("Pilih kelas untuk siswa.");
    const r = await createUser({ username, nis, nama: form.nama.trim(), password: form.password || "1234", role: form.role, kelas: kelasValue });
    if (!r.ok) return alert(r.error);
    setForm({username:"",nis:"",password:"1234",nama:"",role:"siswa",kelas:"",status:"aktif"});
    setShowModal(false);
  };

  const saveEdit=async e=>{
    e.preventDefault();
    const newUsername = editForm.username.trim();
    const nis = editForm.nis.trim() || newUsername;
    if (users.some(x=>x.id!==editUser.id && x.username===newUsername)) return alert("Username/NIS sudah dipakai user lain.");
    const kelasValue = needsKelas(editForm.role) ? editForm.kelas : "";
    if (editForm.role === 'siswa' && !kelasValue) return alert("Pilih kelas untuk siswa.");
    const r = await updateUser(editUser.id, { username: newUsername, nis, nama: editForm.nama.trim(), role: editForm.role, kelas: kelasValue, ...(editForm.password?{password:editForm.password}:{}) });
    if (!r.ok) return alert(r.error);
    setShowEditModal(false);
    setEditUser(null);
  };

  const handleImport = e=>{
    const f = e.target.files[0]; if (!f) return;
    e.target.value = ""; // izinkan import file yang sama dua kali
    const finishImport = async (rows) => {
      const r = await importUsers(rows);
      if (r.ok) alert(`Import selesai: ${r.imported} user ditambahkan${r.skipped ? `, ${r.skipped} duplikat dilewati` : ""}${r.errors?.length ? `, ${r.errors.length} baris tidak valid` : ""}.`);
      else alert(r.error || "Gagal import");
    };
    const pick = (obj, keys) => { for (const k of Object.keys(obj)) { if (keys.includes(k.trim().toLowerCase())) return obj[k]; } return ""; };
    const r = new FileReader();
    if (/\.(xlsx|xls)$/i.test(f.name)) {
      r.onload = async () => {
        try {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(r.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const arr = XLSX.utils.sheet_to_json(ws, { defval: "" });
          finishImport(arr.map(o => ({
            username: pick(o, ["username","nis","nisn","nip","user"]),
            nama: pick(o, ["nama","nama lengkap","nama siswa","name"]),
            password: pick(o, ["password","pass","sandi"]),
            role: pick(o, ["role","peran","jabatan"]),
            kelas: pick(o, ["kelas","class","rombel"]),
          })));
        } catch (err) { alert("Gagal membaca file Excel: " + err.message); }
      };
      r.readAsArrayBuffer(f);
    } else {
      r.onload = () => {
        try {
          const text = String(r.result);
          const lines = text.split(/\r?\n/).filter(l=>l.trim());
          if (lines.length===0) throw new Error("File kosong");
          const header = lines[0].toLowerCase();
          const start = header.includes("username") || header.includes("nis") ? 1 : 0;
          finishImport(lines.slice(start).map(line => {
            const cols = line.split(",").map(c=>c.trim().replace(/^"|"$/g,""));
            return { username: cols[0], nama: cols[1], password: cols[2], role: cols[3], kelas: cols[4] };
          }));
        } catch (err) { alert("Gagal membaca file: " + err.message); }
      };
      r.readAsText(f);
    }
  };

  const downloadTemplate = () => {
    exportXLSX([
      { Username: "1001", Nama: "Contoh Siswa", Password: "1234", Role: "siswa", Kelas: "X RPL 1" },
      { Username: "1101", Nama: "Siswa Kedua", Password: "1234", Role: "siswa", Kelas: "XI TKJ 1" },
      { Username: "piket02", Nama: "Contoh Guru Piket", Password: "1234", Role: "piket", Kelas: "" },
    ], "template-import-user.xlsx", "Template");
  };

  return <div className="space-y-5">
    {/* Header hijau ramping */}
    <div className="bg-[#007A33] rounded-xl p-3 md:p-4 shadow-sm text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight">Manajemen User &amp; Role</h2>
        <p className="text-white/70 text-xs mt-0.5">Kelola akun semua role</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center lg:justify-end">
        <button onClick={downloadTemplate} className="btn-pill bg-indigo-500 text-white shadow-md hover:bg-indigo-600 transition-all text-xs px-2.5 py-1.5 whitespace-nowrap">⬇ Template</button>
        <label className="btn-pill bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-all cursor-pointer flex items-center gap-1 text-xs px-2.5 py-1.5 whitespace-nowrap">
          Import Excel (.xlsx)
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport}/>
        </label>
        <button onClick={()=>exportXLSX(users.map(u=>({Username:u.username,Nama:u.nama,Role:u.role,Kelas:u.kelas||'-',Status:u.status||'aktif'})),"users.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-2.5 py-1.5 whitespace-nowrap">📤 Export Excel</button>
        <button onClick={()=>setShowModal(true)} className="btn-pill bg-violet-500 text-white shadow-md hover:bg-violet-600 transition-all text-xs px-2.5 py-1.5 whitespace-nowrap">+ Tambah User</button>
        {/* Hapus massal per role */}
        <div className="btn-pill bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-all text-xs px-2.5 py-1.5 max-w-full">
          <select aria-label="Hapus semua user per role" className="bg-transparent border-none text-xs text-white font-medium focus:outline-none cursor-pointer py-1 max-w-[150px] sm:max-w-none truncate" onChange={e=>deleteByRole(e.target.value)} value="">
            <option value="" style={{color:'#1E1E1E'}}>🗑️ Hapus per Role</option>
            <option value="siswa" style={{color:'#1E1E1E'}}>Hapus Semua Siswa</option>
            <option value="piket" style={{color:'#1E1E1E'}}>Hapus Semua Piket</option>
            <option value="bk" style={{color:'#1E1E1E'}}>Hapus Semua BK</option>
            <option value="wali_kelas" style={{color:'#1E1E1E'}}>Hapus Semua Wali Kelas</option>
            <option value="satpam" style={{color:'#1E1E1E'}}>Hapus Semua Satpam</option>
            <option value="admin" style={{color:'#1E1E1E'}}>Hapus Semua Admin</option>
          </select>
        </div>
        {/* Hapus terpilih */}
        {selectedIds.size>0 && (
          <button onClick={deleteSelected} className="btn-pill bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-all text-xs px-2.5 py-1.5 whitespace-nowrap">
            🗑️ Hapus Terpilih ({selectedIds.size})
          </button>
        )}
      </div>
    </div>

    {/* Kotak pencarian nama */}
    <div className="flex gap-2">
      <Input label="Cari Nama / NIS" value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder="Ketik nama atau NIS..." className="max-w-xs w-full"/>
    </div>

    {/* Tabel users - header hijau rapi seperti referensi */}
    <div className="sismon-card overflow-hidden border border-[#007A33]/30 rounded-xl shadow-sm mt-0 pt-0">
      <div className="table-wrap overflow-x-auto mt-0 pt-0" style={{padding:0,margin:0}}>
        <table className="w-full text-base border-collapse border border-[#007A33]/40 mt-0 pt-0" style={{borderSpacing:0,padding:0,margin:0}}>
          <colgroup>
            <col style={{width:"52px"}}/>
            <col style={{width:"150px"}}/>
            <col style={{width:"160px"}}/>
            <col style={{width:"120px"}}/>
            <col style={{width:"130px"}}/>
            <col style={{width:"140px"}}/>
          </colgroup>
          <thead style={{padding:0,margin:0}}>
            <tr className="bg-[#007A33] border-b border-[#007A33]/60 select-none mt-0 pt-0" style={{padding:0,margin:0}}>
              <th className="p-3 text-center font-bold uppercase text-xs tracking-wider" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>
                <input type="checkbox" className="w-4 h-4 rounded text-[#007A33] accent-[#007A33]" onChange={e=>selectAll(e.target.checked)} aria-label="Pilih semua"/>
              </th>
              <th onClick={()=>handleSort("username")} className="p-3 font-bold uppercase text-xs tracking-wider text-left" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>
                Username / NIS <span className="ml-1 text-white/80 text-xs" style={{color:'#ffffff'}}>{sortBy==="username" ? (sortDir==="asc" ? "▲" : "▼") : "↕"}</span>
              </th>
              <th onClick={()=>handleSort("nama")} className="p-3 font-bold uppercase text-xs tracking-wider text-left" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>
                Nama <span className="ml-1 text-white/80 text-xs" style={{color:'#ffffff'}}>{sortBy==="nama" ? (sortDir==="asc" ? "▲" : "▼") : "↕"}</span>
              </th>
              <th onClick={()=>handleSort("role")} className="p-3 font-bold uppercase text-xs tracking-wider text-left" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>
                Role <span className="ml-1 text-white/80 text-xs" style={{color:'#ffffff'}}>{sortBy==="role" ? (sortDir==="asc" ? "▲" : "▼") : "↕"}</span>
              </th>
              <th onClick={()=>handleSort("kelas")} className="p-3 font-bold uppercase text-xs tracking-wider text-left" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>
                Kelas <span className="ml-1 text-white/80 text-xs" style={{color:'#ffffff'}}>{sortBy==="kelas" ? (sortDir==="asc" ? "▲" : "▼") : "↕"}</span>
              </th>
              <th className="p-3 font-bold uppercase text-xs tracking-wider text-left" style={{padding:"10px 12px",margin:0,color:'#ffffff'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(u=> {
              const rc = roleColors[u.role] || "bg-gray-50 text-gray-700";
              const isSelected = selectedIds.has(u.id);
              return (
                <tr key={u.id} className={`bg-white border-b border-[#007A33]/20 hover:bg-[#eef2f7] transition-all ${isSelected?"bg-[#dcfce7]":""}`}>
                  <td className="p-3 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#007A33] accent-[#007A33]" checked={isSelected} onChange={()=>toggleSelect(u.id)} aria-label={`Pilih ${u.username}`}/>
                  </td>
                  <td className="p-3 font-semibold text-base text-[#1E1E1E]">{u.username}</td>
                  <td className="p-3 text-base">{u.nama}</td>
                  <td className="p-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${rc}`}>{u.role}</span></td>
                  <td className="p-3 text-sm">{u.kelas||"-"}</td>
                  <td className="p-3 text-left space-x-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={()=>{
                          setEditUser(u);
                          setEditForm({username:u.username||"", nis:u.nis||"", password:"", nama:u.nama||"", role:u.role||"siswa", kelas:u.kelas||""});
                          setShowEditModal(true);
                        }}
                        className="text-xs font-medium text-[#007A33] hover:text-[#006122] hover:underline flex items-center gap-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={()=>deleteOne(u)}
                        className="text-xs font-medium text-[#b91c1c] hover:text-[#7f1d1d] hover:underline flex items-center gap-1"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedUsers.length===0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500 text-base">Belum ada user terdaftar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal Tambah User */}
    {showModal && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
      <form onSubmit={add} className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-white" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#007A33] flex items-center justify-center text-white text-xs">+</div>
            <h3 className="font-bold text-lg text-[#1E1E1E]">Tambah User</h3>
          </div>
          <button type="button" onClick={()=>setShowModal(false)} className="text-gray-400 text-xl hover:text-gray-600 transition">✕</button>
        </div>
        <div className="space-y-4">
          <Input label="Username / NIS" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/>
          <Input label="NIS (Nomor Induk Siswa)" value={form.nis} onChange={e=>setForm({...form,nis:e.target.value})} placeholder="Kosongkan jika sama dengan Username"/>
          <Input label="Nama" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} required/>
          <Input label="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
          <Select label="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value, ...(needsKelas(e.target.value) ? {} : { kelas: "" })})}>
            <option value="siswa">siswa</option>
            <option value="piket">piket</option>
            <option value="bk">bk</option>
            <option value="wali_kelas">wali_kelas</option>
            <option value="satpam">satpam</option>
            <option value="admin">admin</option>
          </Select>
          {needsKelas(form.role) && (
            <Select label={form.role === 'wali_kelas' ? "Kelas yang diampu (opsional)" : "Kelas"} value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})} required={form.role === 'siswa'}>
              {kelasOptions}
            </Select>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 border border-[rgba(15,23,42,0.12)] rounded-xl text-sm text-[#475569] font-medium hover:bg-gray-50 transition">Batal</button>
          <Button className="flex-1 sismon-btn sm:w-auto px-8">Simpan User</Button>
        </div>
      </form>
    </div>}

    {/* Modal Edit User */}
    {showEditModal && editUser && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowEditModal(false)}>
      <form onSubmit={saveEdit} className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-white" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#3b82f6] flex items-center justify-center text-white text-xs">✏️</div>
            <h3 className="font-bold text-lg text-[#1E1E1E]">Edit User</h3>
          </div>
          <button type="button" onClick={()=>setShowEditModal(false)} className="text-gray-400 text-xl hover:text-gray-600 transition">✕</button>
        </div>
        <div className="space-y-4">
          <Input label="Username / NIS" value={editForm.username} onChange={e=>setEditForm({...editForm,username:e.target.value})} required/>
          <Input label="NIS (Nomor Induk Siswa)" value={editForm.nis} onChange={e=>setEditForm({...editForm,nis:e.target.value})} placeholder="Kosongkan jika sama dengan Username"/>
          <Input label="Nama" value={editForm.nama} onChange={e=>setEditForm({...editForm,nama:e.target.value})} required/>
          <Input label="Password (kosongkan jika tidak diubah)" type="password" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})}/>
          <Select label="Role" value={editForm.role} onChange={e=>setEditForm({...editForm, role:e.target.value, ...(needsKelas(e.target.value) ? {} : { kelas: "" })})}>
            <option value="siswa">siswa</option>
            <option value="piket">piket</option>
            <option value="bk">bk</option>
            <option value="wali_kelas">wali_kelas</option>
            <option value="satpam">satpam</option>
            <option value="admin">admin</option>
          </Select>
          {needsKelas(editForm.role) && (
            <Select label={editForm.role === 'wali_kelas' ? "Kelas yang diampu (opsional)" : "Kelas"} value={editForm.kelas} onChange={e=>setEditForm({...editForm,kelas:e.target.value})} required={editForm.role === 'siswa'}>
              {kelasOptions}
            </Select>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-3 border border-[rgba(15,23,42,0.12)] rounded-xl text-sm text-[#475569] font-medium hover:bg-gray-50 transition">Batal</button>
          <button type="submit" className="flex-1 sismon-btn sm:w-auto px-8">Simpan Perubahan</button>
        </div>
      </form>
    </div>}
  </div>;
}
export function AdminKategori(){
  const { kategori, saveKategori, deleteKategori } = useApp();
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({nama:"",verifikator:"piket",maks_durasi_menit:60});
  const [search,setSearch]=useState("");
  const filtered = kategori.filter(k=>k.nama.toLowerCase().includes(search.toLowerCase()));
  const piketCount = kategori.filter(k=>k.verifikator==="piket").length;
  const bkCount = kategori.length - piketCount;
  const openAdd = () => { setEditItem(null); setForm({nama:"",verifikator:"piket",maks_durasi_menit:60}); setShowModal(true); };
  const openEdit = (k) => { setEditItem(k); setForm({nama:k.nama, verifikator:k.verifikator, maks_durasi_menit:k.maks_durasi_menit}); setShowModal(true); };
  const save = async e => { e.preventDefault(); const nama = form.nama.trim(); const r = await saveKategori(editItem?.id ?? null, { nama, verifikator: form.verifikator, maks_durasi_menit: Number(form.maks_durasi_menit)||0 }); if (!r.ok) return alert(r.error); setShowModal(false); };
  const remove = async k => { if (!confirm(`Hapus kategori "${k.nama}"?`)) return; const r = await deleteKategori(k.id); if (!r.ok) alert(r.error); };
  const verifikatorBadge = v => v==="bk" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200";
  return <div className="space-y-5">
    <AdminHeader title="Kategori Izin" subtitle="Kelola jenis izin, verifikator & batas durasi">
      <button onClick={openAdd} className="btn-pill bg-violet-500 text-white shadow-md hover:bg-violet-600 transition-all text-xs px-3 py-2 whitespace-nowrap">+ Tambah Kategori</button>
    </AdminHeader>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ColorStat from="#6366f1" to="#4f46e5" label="Total Kategori" value={kategori.length} hint="Jenis izin terdaftar"/>
      <ColorStat from="#2563eb" to="#1d4ed8" label="Via Piket" value={piketCount} hint="Diverifikasi petugas piket"/>
      <ColorStat from="#9333ea" to="#7e22ce" label="Via BK" value={bkCount} hint="Diverifikasi Bimbingan Konseling"/>
    </div>

    <div className="flex gap-2">
      <Input label="Cari Kategori" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ketik nama kategori..." className="max-w-xs w-full"/>
    </div>

    <GreenTable columns={["Nama Kategori","Verifikator","Maks Durasi","Aksi"]} empty={filtered.length===0 ? "Belum ada kategori terdaftar" : null}>
      {filtered.map(k=> <Row key={k.id}>
        <td className={td}><span className="font-semibold text-[#1E1E1E]">{k.nama}</span></td>
        <td className={td}><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${verifikatorBadge(k.verifikator)}`}>{k.verifikator==="bk"?"BK":"Piket"}</span></td>
        <td className={td}>{k.maks_durasi_menit} menit</td>
        <td className={td}><div className="flex items-center gap-3">
          <button onClick={()=>openEdit(k)} className="text-xs font-medium text-[#007A33] hover:underline">Edit</button>
          <button onClick={()=>remove(k)} className="text-xs font-medium text-[#b91c1c] hover:underline">Hapus</button>
        </div></td>
      </Row>)}
    </GreenTable>

    {showModal && <Modal title={editItem ? "Edit Kategori" : "Tambah Kategori"} subtitle="Kategori menentukan verifikator & batas durasi izin" onClose={()=>setShowModal(false)}>
      <form onSubmit={save} className="space-y-4">
        <Input label="Nama Kategori" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="mis. Umum, Lomba, Konseling" required/>
        <Select label="Verifikator" value={form.verifikator} onChange={e=>setForm({...form,verifikator:e.target.value})}>
          <option value="piket">Piket saja</option>
          <option value="bk">BK saja</option>
        </Select>
        <Input label="Maks Durasi (menit)" type="number" min="5" value={form.maks_durasi_menit} onChange={e=>setForm({...form,maks_durasi_menit:e.target.value})} required/>
        {modalActions(()=>setShowModal(false))}
      </form>
    </Modal>}
  </div>;
}
export function AdminKelas(){
  const { kelas, users, saveKelas, deleteKelas } = useApp();
  const waliList = users.filter(u=>u.role==="wali_kelas");
  const siswaCount = (nama) => users.filter(u=>u.role==="siswa" && u.kelas===nama).length;
  const totalSiswa = users.filter(u=>u.role==="siswa").length;
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({nama:"",wali_kelas_id:""});
  const [search,setSearch]=useState("");
  const filtered = kelas.filter(k=>k.nama.toLowerCase().includes(search.toLowerCase()));
  const terisi = kelas.filter(k=>k.wali_kelas_id).length;
  const openAdd = () => { setEditItem(null); setForm({nama:"",wali_kelas_id:""}); setShowModal(true); };
  const openEdit = (k) => { setEditItem(k); setForm({nama:k.nama, wali_kelas_id:k.wali_kelas_id||""}); setShowModal(true); };
  const save = async e => { e.preventDefault(); const nama = form.nama.trim(); const r = await saveKelas(editItem?.id ?? null, { nama, wali_kelas_id: form.wali_kelas_id }); if (!r.ok) return alert(r.error); setShowModal(false); };
  const remove = async k => { if (!confirm(`Hapus kelas "${k.nama}"?`)) return; const r = await deleteKelas(k.id); if (!r.ok) alert(r.error); };
  return <div className="space-y-5">
    <AdminHeader title="Kelas & Wali" subtitle="Kelola daftar kelas dan penugasan wali kelas">
      <button onClick={openAdd} className="btn-pill bg-violet-500 text-white shadow-md hover:bg-violet-600 transition-all text-xs px-3 py-2 whitespace-nowrap">+ Tambah Kelas</button>
    </AdminHeader>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ColorStat from="#0f766e" to="#134e4a" label="Total Kelas" value={kelas.length} hint="Rombongan belajar"/>
      <ColorStat from="#2563eb" to="#1d4ed8" label="Wali Terisi" value={`${terisi}/${kelas.length}`} hint="Kelas dengan wali kelas"/>
      <ColorStat from="#ea580c" to="#f97316" label="Total Siswa" value={totalSiswa} hint="Akun siswa terdaftar"/>
    </div>

    <div className="flex gap-2">
      <Input label="Cari Kelas" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ketik nama kelas..." className="max-w-xs w-full"/>
    </div>

    <GreenTable columns={["Nama Kelas","Wali Kelas","Jml Siswa","Aksi"]} empty={filtered.length===0 ? "Belum ada kelas terdaftar" : null}>
      {filtered.map(k=> <Row key={k.id}>
        <td className={td}><span className="font-semibold text-[#1E1E1E]">{k.nama}</span></td>
        <td className={td}>{users.find(u=>u.id===k.wali_kelas_id)?.nama || <span className="text-amber-600 text-xs font-medium">Belum ditugaskan</span>}</td>
        <td className={td}>{siswaCount(k.nama)} siswa</td>
        <td className={td}><div className="flex items-center gap-3">
          <button onClick={()=>openEdit(k)} className="text-xs font-medium text-[#007A33] hover:underline">Edit</button>
          <button onClick={()=>remove(k)} className="text-xs font-medium text-[#b91c1c] hover:underline">Hapus</button>
        </div></td>
      </Row>)}
    </GreenTable>

    {showModal && <Modal title={editItem ? "Edit Kelas" : "Tambah Kelas"} subtitle="Tentukan nama kelas dan wali kelasnya" onClose={()=>setShowModal(false)}>
      <form onSubmit={save} className="space-y-4">
        <Input label="Nama Kelas" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="mis. X RPL 1" required/>
        <Select label="Wali Kelas" value={form.wali_kelas_id} onChange={e=>setForm({...form,wali_kelas_id:e.target.value})}>
          <option value="">Pilih wali (opsional)</option>
          {waliList.map(u=> <option key={u.id} value={u.id}>{u.nama}</option>)}
        </Select>
        {modalActions(()=>setShowModal(false))}
      </form>
    </Modal>}
  </div>;
}
export function AdminLaporan(){
  const { pengajuan, kelas } = useApp();
  const [filter,setFilter]=useState({status:"",kelas:"",dari:"",sampai:""});
  const list = pengajuan.filter(x=> (!filter.status||x.status===filter.status) && (!filter.kelas||x.kelas===filter.kelas) && (!filter.dari||x.tanggal>=filter.dari) && (!filter.sampai||x.tanggal<=filter.sampai));
  const selesai = list.filter(x=>x.status==="selesai").length;
  const ditolak = list.filter(x=>x.status==="ditolak").length;
  const berjalan = list.filter(x=>!["selesai","ditolak"].includes(x.status)).length;
  const kelasOptions = kelas.length ? kelas.map(k=>k.nama) : [...new Set(pengajuan.map(p=>p.kelas).filter(Boolean))];
  const reset = () => setFilter({status:"",kelas:"",dari:"",sampai:""});
  return <div className="space-y-5">
    <AdminHeader title="Laporan & Rekap" subtitle="Filter per periode / kelas / status, lalu export ke Excel">
      <button onClick={()=>exportXLSX(izinRows(list),"laporan.xlsx")} className="btn-pill bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs px-3 py-2 whitespace-nowrap">⬇ Export Excel</button>
    </AdminHeader>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ColorStat from="#2563eb" to="#1d4ed8" label="Terfilter" value={list.length} hint="Sesuai filter aktif"/>
      <ColorStat from="#007A33" to="#00A651" label="Selesai" value={selesai} hint="Tuntas kembali"/>
      <ColorStat from="#ea580c" to="#f97316" label="Sedang Berjalan" value={berjalan} hint="Belum selesai"/>
      <ColorStat from="#D00000" to="#b91c1c" label="Ditolak" value={ditolak} hint="Tidak disetujui"/>
    </div>

    <div className="sismon-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm uppercase tracking-wide text-[#1E1E1E]">Filter Laporan</h3>
        <button onClick={reset} className="text-xs text-[#007A33] font-medium hover:underline">Reset filter</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Select label="Status" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
          <option value="">Semua status</option>
          <option value="diajukan">Diajukan</option>
          <option value="diverifikasi_piket_bk">Diverifikasi Piket/BK</option>
          <option value="disetujui_wali_kelas">Disetujui Wali Kelas</option>
          <option value="menunggu_keluar">Menunggu Keluar</option>
          <option value="sudah_keluar">Sudah Keluar</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </Select>
        <Select label="Kelas" value={filter.kelas} onChange={e=>setFilter({...filter,kelas:e.target.value})}>
          <option value="">Semua kelas</option>
          {kelasOptions.map(k=> <option key={k} value={k}>{k}</option>)}
        </Select>
        <Input label="Dari Tanggal" type="date" value={filter.dari} onChange={e=>setFilter({...filter,dari:e.target.value})}/>
        <Input label="Sampai Tanggal" type="date" value={filter.sampai} onChange={e=>setFilter({...filter,sampai:e.target.value})}/>
      </div>
    </div>

    <GreenTable columns={["Tanggal","Siswa","Kategori","Status","Kode"]} empty={list.length===0 ? "Tidak ada data untuk filter ini" : null}>
      {list.map(x=> <Row key={x.id}>
        <td className={td}>{x.tanggal}</td>
        <td className={td}><span className="font-medium">{x.siswa_nama}</span><br/><span className="text-xs text-gray-500">{x.kelas}</span></td>
        <td className={td}>{x.kategori_nama}</td>
        <td className={td}><StatusBadge status={x.status}/></td>
        <td className={td}><span className="font-mono text-xs">{x.kode||"-"}</span></td>
      </Row>)}
    </GreenTable>
  </div>;
}
export function AdminPengaturan(){
  const { settings, saveSettings } = useApp();
  const set = (k,v) => saveSettings({ ...settings, [k]: v });
  return <div className="space-y-5">
    <AdminHeader title="Pengaturan Sistem" subtitle="Keamanan, notifikasi keterlambatan & jam sekolah efektif" />

    {/* Ringkasan gradien */}
    <div className="rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
      <div>
        <p className="text-[11px] uppercase tracking-widest opacity-80">Jam Sekolah Efektif</p>
        <p className="text-3xl md:text-4xl font-bold mt-1">{settings.jam_masuk||"06:30"} <span className="opacity-70 font-light">–</span> {settings.jam_pulang||"16:00"}</p>
        <p className="text-[11px] opacity-80 mt-1">Pengajuan di luar rentang ini otomatis ditolak</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="bg-white/15 border border-white/25 rounded-full px-4 py-2 text-xs font-medium">⏱ Auto-logout {settings.idleTimeoutMenit} menit</span>
        <span className="bg-white/15 border border-white/25 rounded-full px-4 py-2 text-xs font-medium">⚠ Batas terlambat {settings.batasTerlambatMenit} menit</span>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      {/* Keamanan & Notifikasi */}
      <section className="sismon-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white shrink-0" style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)"}}>🛡️</div>
          <div><h3 className="font-bold text-[#1E1E1E]">Keamanan & Notifikasi</h3><p className="text-xs text-gray-500">Batas sesi & alert keterlambatan siswa</p></div>
        </div>
        <div className="grid gap-3">
          <Input label="Idle timeout / auto-logout (menit)" type="number" min="1" value={settings.idleTimeoutMenit} onChange={e=>set("idleTimeoutMenit",Math.max(1, Number(e.target.value)||1))}/>
          <Input label="Batas terlambat notifikasi (menit)" type="number" min="0" value={settings.batasTerlambatMenit} onChange={e=>set("batasTerlambatMenit",Math.max(0, Number(e.target.value)||0))}/>
          <p className="text-xs text-gray-500">Notifikasi keterlambatan dikirim ke Wali Kelas / BK / orang tua setelah siswa melewati estimasi + batas ini.</p>
        </div>
      </section>

      {/* Jam Sekolah */}
      <section className="sismon-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white shrink-0" style={{background:"linear-gradient(135deg,#ea580c,#f97316)"}}>🕘</div>
          <div><h3 className="font-bold text-[#1E1E1E]">Jam Sekolah Efektif</h3><p className="text-xs text-gray-500">Menentukan validasi jam pengajuan izin</p></div>
        </div>
        <div className="grid gap-3">
          <Input label="Jam masuk sekolah" type="time" value={settings.jam_masuk||"06:30"} onChange={e=>set("jam_masuk",e.target.value)}/>
          <Input label="Jam pulang sekolah" type="time" value={settings.jam_pulang||"16:00"} onChange={e=>set("jam_pulang",e.target.value)}/>
          <p className="text-xs text-gray-500">Pengajuan dengan jam mulai di luar rentang ini ditolak otomatis oleh sistem.</p>
        </div>
      </section>
    </div>

    {/* Validasi otomatis */}
    <section className="sismon-card p-5">
      <h3 className="font-bold text-sm uppercase tracking-wide text-[#1E1E1E] mb-3">Validasi Otomatis Aktif</h3>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {["Tanggal lewat otomatis ditolak","Jam di luar jam sekolah efektif ditolak","Durasi maksimal sesuai kategori izin","QR sekali pakai, kedaluwarsa setelah dipakai","Audit trail immutable (tidak bisa dihapus)","RBAC — Wali Kelas hanya melihat kelasnya"].map((v,i)=> <div key={i} className="flex items-center gap-2 bg-[#f0fdf4] border border-[#007A33]/15 rounded-lg px-3 py-2"><span className="text-[#007A33] font-bold">✓</span><span className="text-gray-700">{v}</span></div>)}
      </div>
      <p className="text-[11px] text-gray-400 mt-3">Pengaturan tersimpan di server — berlaku untuk semua perangkat.</p>
    </section>
  </div>;
}
export function Profil(){
  const { user } = useApp();
  if (!user) return <div className="sismon-card p-6 text-center text-gray-500">Memuat data profil...</div>;
  const initials = (user?.nama||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("");
  const info = [
    ["Nama Lengkap", user?.nama || "-"],
    ["Username", user?.username || "-"],
    ["Role", user?.role || "-"],
    ["Kelas", user?.kelas || "-"],
    ["NIS / NIP", user?.nis || user?.nip || "-"],
    ...(user?.nisn ? [["NISN", user.nisn]] : []),
  ];
  return <div className="space-y-5">
    <AdminHeader title="Profil" subtitle="Informasi akun kamu"/>
    <div className="rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center gap-5" style={{background:"linear-gradient(135deg,#007A33,#00A651)"}}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-3xl sm:text-4xl font-bold shrink-0">{initials}</div>
      <div className="text-center sm:text-left min-w-0">
        <p className="text-2xl font-bold leading-tight">{user.nama}</p>
        <p className="text-white/85 text-sm mt-1">@{user.username}</p>
        <div className="flex gap-2 justify-center sm:justify-start mt-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-3 py-1">{user.role}</span>
          {user.kelas && <span className="text-[11px] font-semibold bg-white/15 border border-white/25 rounded-full px-3 py-1">{user.kelas}</span>}
        </div>
      </div>
    </div>
    <div className="sismon-card p-5 grid sm:grid-cols-2 gap-4">
      {info.map(([label,value])=> <div key={label} className="border border-[#007A33]/15 rounded-xl p-4 bg-[#f8faf8]">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</p>
        <p className="text-sm font-semibold text-[#1E1E1E] mt-1 break-words">{value}</p>
      </div>)}
    </div>
  </div>;
}
