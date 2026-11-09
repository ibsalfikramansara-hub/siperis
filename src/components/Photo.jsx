import { useState } from "react";
export default function Photo({ user, size = 80 }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nama || "Siswa")}&background=6366f1&color=fff&size=${size*2}`;
  return <img src={user?.foto || fallback} alt={user?.nama||"Siswa"} style={{ width: size, height: size, objectFit: "cover", borderRadius: 999 }} />;
}
