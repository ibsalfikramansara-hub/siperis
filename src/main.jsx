import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AppProvider, useApp } from "./store/AppContext.jsx";
import SismonLayout from "./components/SismonLayout.jsx";
import Login from "./pages/Login.jsx";
import { SiswaDashboard, AjukanIzin, StatusIzin, RiwayatSiswa, KodeIzin } from "./pages/Siswa.jsx";
import { PiketDashboard, PiketVerify, PiketRiwayat, BKVerify, BKHistori, BKRiwayat, WaliDashboard, WaliVerify, WaliRekap, WaliRiwayat, SatpamDashboard, SatpamScan, SatpamBelumKembali } from "./pages/Verifikasi.jsx";
import { AdminDashboard, AdminUser, AdminKategori, AdminKelas, AdminLaporan, AdminPengaturan, Profil } from "./pages/Admin.jsx";
import { PengumumanPage } from "./pages/Pengumuman.jsx";
import "./index.css";

function DashboardRouter(){
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role==="siswa") return <SiswaDashboard/>;
  if (user.role==="piket") return <PiketDashboard/>;
  if (user.role==="bk") return <BKHistori/>;
  if (user.role==="wali_kelas") return <WaliDashboard/>;
  if (user.role==="satpam") return <SatpamDashboard/>;
  if (user.role==="admin") return <AdminDashboard/>;
  return <div>Role tidak dikenal</div>;
}

// Hanya boleh diakses role tertentu — selain itu kembali ke Beranda
function RequireRole({ roles, children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace/>;
  if (!roles.includes(user.role)) return <Navigate to="/" replace/>;
  return children;
}

function NotFound(){
  return <div className="sismon-card p-8 md:p-12 text-center max-w-lg mx-auto">
    <p className="text-6xl font-black text-[#007A33]/20">404</p>
    <h2 className="text-xl font-bold text-[#1E1E1E] -mt-2">Halaman Tidak Ditemukan</h2>
    <p className="text-sm text-gray-500 mt-2">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
    <Link to="/" className="sismon-btn sm:w-auto px-6 inline-flex items-center justify-center mt-5">← Kembali ke Beranda</Link>
  </div>;
}

function ProtectedRoutes(){
  const siswa = (el) => <RequireRole roles={["siswa"]}>{el}</RequireRole>;
  const piket = (el) => <RequireRole roles={["piket"]}>{el}</RequireRole>;
  const bk = (el) => <RequireRole roles={["bk"]}>{el}</RequireRole>;
  const wali = (el) => <RequireRole roles={["wali_kelas"]}>{el}</RequireRole>;
  const satpam = (el) => <RequireRole roles={["satpam"]}>{el}</RequireRole>;
  const admin = (el) => <RequireRole roles={["admin"]}>{el}</RequireRole>;
  return <Routes>
    <Route element={<SismonLayout/>}>
      <Route path="/" element={<DashboardRouter/>} />
      <Route path="/pengumuman" element={<PengumumanPage/>} />
      <Route path="/siswa/ajukan" element={siswa(<AjukanIzin/>)} />
      <Route path="/siswa/status" element={siswa(<StatusIzin/>)} />
      <Route path="/siswa/riwayat" element={siswa(<RiwayatSiswa/>)} />
      <Route path="/siswa/kode" element={siswa(<KodeIzin/>)} />
      <Route path="/piket/verifikasi" element={piket(<PiketVerify/>)} />
      <Route path="/piket/riwayat" element={piket(<PiketRiwayat/>)} />
      <Route path="/bk/verifikasi" element={bk(<BKVerify/>)} />
      <Route path="/bk/histori" element={bk(<BKHistori/>)} />
      <Route path="/bk/riwayat" element={bk(<BKRiwayat/>)} />
      <Route path="/wali/verifikasi" element={wali(<WaliVerify/>)} />
      <Route path="/wali/rekap" element={wali(<WaliRekap/>)} />
      <Route path="/wali/riwayat" element={wali(<WaliRiwayat/>)} />
      <Route path="/satpam/scan" element={satpam(<SatpamScan/>)} />
      <Route path="/satpam/belum-kembali" element={satpam(<SatpamBelumKembali/>)} />
      <Route path="/admin/user" element={admin(<AdminUser/>)} />
      <Route path="/admin/kategori" element={admin(<AdminKategori/>)} />
      <Route path="/admin/kelas" element={admin(<AdminKelas/>)} />
      <Route path="/admin/laporan" element={admin(<AdminLaporan/>)} />
      <Route path="/admin/pengaturan" element={admin(<AdminPengaturan/>)} />
      <Route path="/profil" element={<Profil/>} />
      <Route path="*" element={<NotFound/>} />
    </Route>
  </Routes>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><AppProvider><BrowserRouter><Routes><Route path="/login" element={<Login/>}/><Route path="*" element={<ProtectedRoutes/>}/></Routes></BrowserRouter></AppProvider></React.StrictMode>
);
