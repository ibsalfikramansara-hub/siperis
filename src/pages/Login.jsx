import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";
import logo from "../assets/logo-siperis-new.jpg";
import logoMan from "../assets/logo-man-small.png";
import logoWa from "../assets/logo-wa.png";

// CAPTCHA angka warna-warni agak samar, gaya lama
function genCaptcha(){
  const chars="23456789";
  let s=""; for(let i=0;i<5;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
const CAPTCHA_COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#95E1D3","#F38181","#AA96DA"];

export default function Login(){
  const { login, users } = useApp();
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [err,setErr]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [remember,setRemember]=useState(false);
  const [captcha,setCaptcha]=useState(()=>genCaptcha()); const [captchaInput,setCaptchaInput]=useState("");
  const [busy,setBusy]=useState(false);
  const nav = useNavigate();
  const demoUsers = users.length ? users : [{username:"1001",nama:"Ahmad Siswa",role:"siswa"},{username:"1002",nama:"Budi Siswa",role:"siswa"},{username:"1003",nama:"Citra Siswa",role:"siswa"},{username:"piket01",nama:"Pak Piket",role:"piket"},{username:"bk01",nama:"Bu BK",role:"bk"},{username:"wali01",nama:"Bu Wali Kelas",role:"wali_kelas"},{username:"satpam01",nama:"Pak Satpam",role:"satpam"},{username:"admin01",nama:"Admin TU",role:"admin"}];
  const submit = async e=>{
    e.preventDefault();
    if (captchaInput.trim() !== captcha) { setErr("CAPTCHA salah, silakan coba lagi"); setCaptcha(genCaptcha()); setCaptchaInput(""); return; }
    setErr("");
    setBusy(true);
    try {
      const r=await login(username.trim(), password, remember);
      if(r.ok) nav("/");
      else { setErr(r.error); setCaptcha(genCaptcha()); setCaptchaInput(""); }
    } catch {
      setErr("Terjadi kendala saat login. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{background:"linear-gradient(135deg,#007A33 0%, #00A651 60%, #78c0a8 100%)"}}>
    <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl p-5 md:p-7">
      <div className="text-center">
        {/* Logo SIPERIS baru - tanpa shadow agar putihnya menyatu dengan kartu */}
        <div className="mx-auto flex items-center justify-center">
          <img src={logo} alt="Logo SIPERIS - Sistem Perizinan Siswa" className="w-64 md:w-72 h-auto object-contain"/>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border">{err}</div>}
        <label className="block relative">
          <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-[#007A33]">Username</span>
          <input className="sismon-input !bg-[#eaf4ff]" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username / NIS / NIP"/>
        </label>
        <label className="block relative">
          <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-[#007A33]">Password</span>
          <input type={showPw?"text":"password"} className="sismon-input pr-12 !bg-[#eaf4ff]" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">{showPw?"🙈":"👁️"}</button>
        </label>

        {/* CAPTCHA warna-warni samar */}
        <div>
          <div className="text-center py-1 select-none relative overflow-hidden bg-gray-50 rounded-lg border">
            <div className="flex justify-center gap-1 py-2">
              {captcha.split("").map((ch,i)=> <span key={i} className="inline-block text-2xl font-bold" style={{color: CAPTCHA_COLORS[i % CAPTCHA_COLORS.length], opacity: 0.72, transform:`rotate(${(i%2? -1:1)*(i+1)}deg) translateY(${(i%3-1)*2}px)`, letterSpacing:"0.1em", textShadow:"1px 1px 1px rgba(0,0,0,0.15)"}}>{ch}</span>)}
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"><path d="M0 18 Q 120 8 240 16 T 480 14" stroke="#999" fill="none" strokeWidth="1"/><path d="M0 26 Q 120 20 240 24 T 480 22" stroke="#bbb" fill="none" strokeWidth="1"/></svg>
          </div>
          <div className="relative mt-2">
            <input className="sismon-input pr-11" value={captchaInput} onChange={e=>setCaptchaInput(e.target.value)} placeholder="CAPTCHA"/>
            <button type="button" onClick={()=>{setCaptcha(genCaptcha()); setCaptchaInput("");}} className="absolute right-3 top-3 text-[#007A33]">⟳</button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Ingat Saya</label>
          <a href="https://wa.me/6289665266456?text=Halo%20Admin%20SIPERIS%2C%20saya%20lupa%20password%2C%20mohon%20bantuannya" target="_blank" rel="noreferrer" className="text-[#007A33] text-xs hover:underline">Lupa Password?</a>
        </div>

        <button disabled={busy} className="w-full bg-gradient-to-r from-[#007A33] to-[#00A651] text-white py-3 rounded-xl font-bold disabled:opacity-60 transition">
          {busy ? "Memproses..." : "➤ Log In"}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400"><div className="flex-1 border-t"></div>OR<div className="flex-1 border-t"></div></div>
        <div className="grid grid-cols-2 gap-3">
          <a href="https://man1jepara.sch.id" target="_blank" rel="noreferrer" className="border rounded-xl py-2 text-sm flex items-center justify-center gap-2 hover:border-[#007A33] hover:bg-[#f3faf5] transition"><img src={logoMan} alt="Logo MAN 1 Jepara" className="w-5 h-5 object-contain"/> MANSARA</a>
          <a href="https://wa.me/6289665266456?text=Halo%20Admin%20SIPERIS%2C%20saya%20butuh%20bantuan" target="_blank" rel="noreferrer" className="border rounded-xl py-2 text-sm flex items-center justify-center gap-2 hover:border-[#25D366] hover:bg-[#f0fdf4] transition"><img src={logoWa} alt="WhatsApp Admin" className="w-5 h-5"/> Admin</a>
        </div>
        <Link to="/" className="block border rounded-xl py-2 text-sm text-center text-gray-600 hover:bg-gray-50 transition">‹ Kembali ke Beranda</Link>

        <div className="text-center text-[10px] text-gray-400 pt-1">⌬ Tim Pengembang Aplikasi XE4</div>
      </form>
    </div>
  </div>;
}
