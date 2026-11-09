// Komponen bersama untuk halaman admin: header hijau + kartu statistik gradien + modal pop-up.
// Dipakai agar semua halaman admin tampil konsisten dengan Dashboard & User & Role.

export function AdminHeader({ title, subtitle, children }) {
  return (
    <div className="bg-[#007A33] rounded-xl p-4 md:p-5 shadow-sm text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-white/75 text-xs mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 items-center lg:justify-end">{children}</div>}
    </div>
  );
}

export function ColorStat({ from, to, label, value, hint }) {
  return (
    <div className="rounded-2xl p-4 md:p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg,${from},${to})` }}>
      <p className="text-[11px] uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-3xl md:text-4xl font-bold mt-1">{value}</p>
      {hint && <p className="text-[11px] opacity-80 mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] border border-white my-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 p-5 pb-0">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-[#1E1E1E]">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-2 shrink-0">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Tabel gaya admin (header hijau) — konsisten dengan halaman User & Role
export function GreenTable({ columns, children, empty }) {
  return (
    <div className="sismon-card overflow-hidden border border-[#007A33]/30 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#007A33] text-white select-none">
              {columns.map((c, i) => (
                <th key={i} className="p-3 text-left text-xs font-bold uppercase tracking-wider">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
            {empty && (
              <tr><td colSpan={columns.length} className="p-6 text-center text-gray-500">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Row = ({ children }) => (
  <tr className="bg-white border-b border-[#007A33]/15 hover:bg-[#eef2f7] transition-all">{children}</tr>
);

export const td = "p-3 align-middle";
export const modalActions = (onCancel) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel} className="flex-1 py-3 border border-[rgba(15,23,42,0.12)] rounded-xl text-sm text-[#475569] font-medium hover:bg-gray-50 transition">Batal</button>
    <button type="submit" className="flex-1 sismon-btn sm:w-auto px-6">Simpan</button>
  </div>
);
