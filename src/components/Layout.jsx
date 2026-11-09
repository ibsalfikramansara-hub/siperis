import { Link, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";

const menus = {
  siswa: [{to:"/",label:"Dashboard"},{to:"/siswa/ajukan",label:"Ajukan Izin"},{to:"/siswa/status",label:"Status Izin Saya"},{to:"/siswa/riwayat",label:"Riwayat Izin"},{to:"/siswa/kode",label:"Kartu/Kode Izin"},{to:"/profil",label:"Profil"}],
  piket: [{to:"/",label:"Dashboard"},{to:"/piket/verifikasi",label:"Verifikasi Izin"},{to:"/piket/riwayat",label:"Riwayat Verifikasi"},{to:"/profil",label:"Profil"}],
  bk: [{to:"/",label:"Dashboard"},{to:"/bk/verifikasi",label:"Verifikasi Izin"},{to:"/bk/histori",label:"Data & Histori Siswa"},{to:"/bk/riwayat",label:"Riwayat Verifikasi"},{to:"/profil",label:"Profil"}],
  wali_kelas: [{to:"/",label:"Dashboard"},{to:"/wali/verifikasi",label:"Mengetahui/Approval"},{to:"/wali/rekap",label:"Rekap Izin Kelas"},{to:"/wali/riwayat",label:"Riwayat"},{to:"/profil",label:"Profil"}],
  satpam: [{to:"/",label:"Dashboard"},{to:"/satpam/scan",label:"Scan / Verifikasi Gerbang"},{to:"/satpam/belum-kembali",label:"Siswa Belum Kembali"},{to:"/profil",label:"Profil"}],
  admin: [{to:"/",label:"Dashboard"},{to:"/admin/user",label:"User & Role"},{to:"/admin/kategori",label:"Kategori Izin"},{to:"/admin/kelas",label:"Kelas & Wali"},{to:"/admin/laporan",label:"Laporan & Rekap"},{to:"/admin/pengaturan",label:"Pengaturan Sistem"},{to:"/profil",label:"Profil"}],
};

export default function Layout() {
  const { user, logout } = useApp();
  const nav = useNavigate(); const loc = useLocation();
  if (!user) return <Navigate to="/login" replace/>;
  const role = user.role;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold">Perizinan Siswa</div><span className="text-xs bg-gray-100 px-2 py-1 rounded">Role: {role}</span></div>
          <div className="flex items-center gap-3"><span className="text-sm text-gray-600">{user.nama} ({user.username})</span><button onClick={()=>{logout(); nav("/login")}} className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg">Logout</button></div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <aside className="w-56 shrink-0 no-print"><nav className="bg-white rounded-xl shadow border p-3 space-y-1">{(menus[role]||[]).map(m=> <Link key={m.to} to={m.to} className={`block px-3 py-2 rounded-lg text-sm ${loc.pathname===m.to||(m.to!=="/"&&loc.pathname.startsWith(m.to))?"bg-indigo-600 text-white":"hover:bg-gray-100"}`}>{m.label}</Link>)}</nav></aside>
        <main className="flex-1 min-w-0"><Outlet/></main>
      </div>
    </div>
  );
}
