import { useEffect, useRef, useState } from "react";

export default function QrScanner({ onRead }) {
  const ref = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setOn(false);
    if (ref.current) ref.current.innerHTML = "";
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      streamRef.current = stream;
      const video = document.createElement("video");
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      if (ref.current) { ref.current.innerHTML = ""; ref.current.appendChild(video); }
      setOn(true);
      setErr("");

      if (!('BarcodeDetector' in window)) {
        setErr("Browser ini belum mendukung pemindaian kamera otomatis (BarcodeDetector API). Gunakan input kode izin secara manual di bawah.");
      }

      // Cek frame QR setiap 500ms pakai BarcodeDetector (Chrome/Edge/Android)
      const loop = async () => {
        if (!streamRef.current) return;
        try {
          if ('BarcodeDetector' in window) {
            const bd = new window.BarcodeDetector({ formats: ["qr_code"] });
            const codes = await bd.detect(video);
            if (codes.length) { onRead(codes[0].rawValue); return stop(); }
          }
        } catch {}
        if (streamRef.current) {
          timerRef.current = setTimeout(loop, 500);
        }
      };
      loop();
    } catch (e) {
      setErr("Kamera tidak tersedia atau izin ditolak. Silakan gunakan input kode manual di bawah.");
    }
  };

  useEffect(() => () => stop(), []);

  return <div className="border rounded-xl p-3 bg-gray-50">
    <div ref={ref} className="flex justify-center" style={{ minHeight: on ? 180 : 0 }} />
    {err && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">{err}</p>}
    <div className="mt-2">
      {!on ? <button onClick={start} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition">☐ Scan / Aktifkan Kamera</button> : <button onClick={stop} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">Berhenti</button>}
    </div>
  </div>;
}
