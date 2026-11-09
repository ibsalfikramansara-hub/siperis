import { Link, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";
import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

const menus = {
  siswa: [{to:"/",label:"Beranda",icon:"home"},{to:"/siswa/ajukan",label:"Ajukan Izin",icon:"plus"},{to:"/siswa/status",label:"Status Izin",icon:"clock"},{to:"/siswa/riwayat",label:"Riwayat Izin",icon:"doc"},{to:"/siswa/kode",label:"Kode Izin",icon:"ticket"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/profil",label:"Profil",icon:"user"}],
  piket: [{to:"/",label:"Beranda",icon:"home"},{to:"/piket/verifikasi",label:"Verifikasi Izin",icon:"check"},{to:"/piket/riwayat",label:"Riwayat",icon:"doc"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/profil",label:"Profil",icon:"user"}],
  bk: [{to:"/",label:"Beranda",icon:"home"},{to:"/bk/verifikasi",label:"Verifikasi Izin",icon:"check"},{to:"/bk/histori",label:"Histori Siswa",icon:"chart"},{to:"/bk/riwayat",label:"Riwayat",icon:"doc"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/profil",label:"Profil",icon:"user"}],
  wali_kelas: [{to:"/",label:"Beranda",icon:"home"},{to:"/wali/verifikasi",label:"Approval",icon:"check"},{to:"/wali/rekap",label:"Rekap Kelas",icon:"chart"},{to:"/wali/riwayat",label:"Riwayat",icon:"doc"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/profil",label:"Profil",icon:"user"}],
  satpam: [{to:"/",label:"Beranda",icon:"home"},{to:"/satpam/scan",label:"Scan Gerbang",icon:"camera"},{to:"/satpam/belum-kembali",label:"Belum Kembali",icon:"warn"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/profil",label:"Profil",icon:"user"}],
  admin: [{to:"/",label:"Beranda",icon:"home"},{to:"/admin/user",label:"User & Role",icon:"users"},{to:"/admin/kategori",label:"Kategori Izin",icon:"tag"},{to:"/admin/kelas",label:"Kelas & Wali",icon:"school"},{to:"/admin/laporan",label:"Laporan",icon:"chart"},{to:"/pengumuman",label:"Lihat Pengumuman",icon:"doc"},{to:"/admin/pengaturan",label:"Pengaturan",icon:"settings"},{to:"/profil",label:"Profil",icon:"user"}],
};

const ARTIKEL_DEFAULT = [
  { tanggal:"25 Mei 2026", judul:"44 Siswa MAN 1 Jepara Lolos SNBT 2026, Bukti Konsistensi Madrasah Mencetak Generasi Berprestasi", desc:"44 siswa MAN 1 Jepara lolos SNBT 2026..." },
  { tanggal:"23 Mei 2026", judul:"Cluster Festival MAN 1 Jepara, Ajang Display Kreativitas Siswa", desc:"Cluster Festival MAN 1 Jepara..." },
  { tanggal:"7 Mei 2026", judul:"Tim MRC MAN 1 Jepara Menyabet 1st Runner Up pada Grand Final Ajang Internasional di Thailand", desc:"Tim MRC MAN 1 Jepara menyabet 1st Runner Up..." },
];

export default function SismonLayout(){
  const { user, logout, pengumuman = [], online } = useApp();
  const nav = useNavigate(); const loc = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [tabInfo, setTabInfo] = useState("Pengumuman");
  const [artikel,setArtikel]=useState(ARTIKEL_DEFAULT);
  useEffect(()=>{
    // Ambil otomatis 3 berita terbaru dari situs madrasah (WordPress REST API)
    fetch("https://man1jepara.sch.id/wp-json/wp/v2/posts?per_page=3&_fields=date,title,excerpt,link")
      .then(r=>r.json())
      .then(arr=>{ if (Array.isArray(arr)) setArtikel(arr.map(p=>({ tanggal:new Date(p.date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}), judul:p.title?.rendered||"", desc:(p.excerpt?.rendered||"").replace(/<[^>]*>/g,"").slice(0,120)+"...", link:p.link }))); })
      .catch(()=>{});
  },[]);
  if (!user) return <Navigate to="/login" replace/>;
  const role = user.role;
  const active = (m) => loc.pathname===m.to || (m.to!=="/" && loc.pathname.startsWith(m.to));
  const isWidePage = ['/admin/user', '/admin/laporan', '/admin/kelas', '/wali/rekap'].includes(loc.pathname);

  return <div className="min-h-screen">
    {/* Header putih gaya SAPUJAGAT → diganti SIPERIS */}
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <button className="lg:hidden p-2 shrink-0" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="menu"><Icon name={mobileMenu?"close":"menu"} size={26}/></button>
          <span className="font-bold tracking-widest text-lg sm:text-2xl md:text-[26px] text-[#1E1E1E] whitespace-nowrap">SIPERIS<span className="hidden md:inline text-[#006122] font-normal"> | Perizinan Siswa</span></span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <img src={user.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=006122&color=fff`} alt="profil" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-[#006122]"/>
          <span className="hidden sm:block text-sm font-medium uppercase max-w-[160px] truncate">{user.nama}</span>
          <button onClick={()=>{logout(); nav("/login")}} className="bg-white text-[#006122] border border-[#006122] text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-full flex items-center gap-1 whitespace-nowrap"><Icon name="logout" size={14}/> Keluar</button>
        </div>
      </div>
    </header>

    {/* Hero hijau — teks diperkecil sedikit, role/kelas/username dihilangkan */}
    <div className="bg-[#006122] text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div><p className="text-base md:text-lg font-bold">Selamat Datang, {user.nama}</p></div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-5 flex gap-6 pb-24">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-60 shrink-0 no-print">
        <nav className="sismon-card p-3 space-y-1 sticky top-[72px]">
          {(menus[role]||[]).map(m=> <Link key={m.to} to={m.to} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${active(m)?"bg-[#006122] text-white":"hover:bg-[#f5f5f5]"}`}><Icon name={m.icon} size={20}/><span>{m.label}</span></Link>)}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileMenu && <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={()=>setMobileMenu(false)}>
        <div className="bg-white w-72 h-full p-4 space-y-1" onClick={e=>e.stopPropagation()}>
          {(menus[role]||[]).map(m=> <Link key={m.to} to={m.to} onClick={()=>setMobileMenu(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${active(m)?"bg-[#006122] text-white":"hover:bg-gray-100"}`}><Icon name={m.icon} size={20}/><span>{m.label}</span></Link>)}
        </div>
      </div>}

      <main className="flex-1 min-w-0 grid lg:grid-cols-3 gap-5">
        <div className={isWidePage ? "lg:col-span-3 min-w-0" : "lg:col-span-2 min-w-0"}>
          <Outlet/>
        </div>

        {/* Panel Informasi Terkini gaya SAPUJAGAT (di kanan di desktop, di bawah di HP/halaman lebar) */}
        <aside className={`sismon-card overflow-hidden h-fit ${isWidePage ? "lg:col-span-3" : ""}`}>
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="font-bold text-sm">📢 Informasi Terkini</h3>
            {online
              ? <span className="text-[11px] bg-[#006122]/10 text-[#006122] px-2 py-1 rounded-full">● Online</span>
              : <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full">○ Offline</span>}
          </div>
          <div className="flex gap-2 p-4 pb-3">
            <button onClick={()=>setTabInfo("Pengumuman")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tabInfo==="Pengumuman"?"bg-[#006122] text-white":"bg-gray-100"}`}>🔔 Pengumuman</button>
            <button onClick={()=>setTabInfo("Artikel")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tabInfo==="Artikel"?"bg-[#006122] text-white":"bg-gray-100"}`}>📄 Artikel</button>
          </div>
          <div className="px-4 pb-4 space-y-3">
            {tabInfo==="Pengumuman"
              ? <>{pengumuman.slice(0,3).map((p,i)=> <div key={i} className="border rounded-xl p-3">
                <p className="text-[11px] text-gray-500">{p.tanggal}</p>
                <p className="text-sm font-semibold mt-1 leading-snug">{p.judul}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.desc}</p>
              </div>)}{pengumuman.length===0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada pengumuman</p>}
              <Link to="/pengumuman" className="text-[#006122] text-sm text-center block py-2">Lihat lainnya ➜</Link></>
              : <>{artikel.slice(0,3).map((p,i)=> <div key={i} className="border rounded-xl p-3">
                <p className="text-[11px] text-gray-500">{p.tanggal}</p>
                <p className="text-sm font-semibold mt-1 leading-snug">{p.judul}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.desc}</p>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-[#006122] text-xs">Baca selengkapnya ➜</a>}
              </div>)}
              <a href="https://man1jepara.sch.id" target="_blank" rel="noreferrer" className="text-[#006122] text-sm text-center block py-2">Lihat lainnya di man1jepara.sch.id ➜</a></>
            }
          </div>
        </aside>
      </main>
    </div>

    {/* Bottom nav ala TabLayout Sismon */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden no-print">
      <div className="flex justify-around py-2">
        <Link to="/" className={`flex flex-col items-center text-[11px] ${active({to:"/"})?"text-[#006122] font-bold":"text-[#757575]"}`}><Icon name="home" size={22}/>Beranda</Link>
        <Link to="/pengumuman" className={`flex flex-col items-center text-[11px] ${active({to:"/pengumuman"})?"text-[#006122] font-bold":"text-[#757575]"}`}><Icon name="doc" size={22}/>Lihat Pengumuman</Link>
        <Link to="/profil" className={`flex flex-col items-center text-[11px] ${active({to:"/profil"})?"text-[#006122] font-bold":"text-[#757575]"}`}><Icon name="user" size={22}/>Profil</Link>
      </div>
    </div>
  </div>;
}
