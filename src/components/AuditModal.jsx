import { useApp } from "../store/AppContext.jsx";
export default function AuditModal({ izinId, onClose }) {
  const { auditTrail } = useApp();
  const list = (auditTrail || []).filter(a => a.izin_id === izinId);
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="bg-white rounded-xl p-5 max-w-lg w-full" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between"><b>Audit Trail (immutable)</b><button onClick={onClose}>✕</button></div>
      {list.length===0 && <p className="text-sm text-gray-500 mt-2">Belum ada log</p>}
      {list.map((a,i)=><div key={i} className="text-sm border-b py-2"><b>{a.action}</b> — {a.actor} ({a.role}) — {new Date(a.at).toLocaleString("id-ID")}<br/><span className="text-xs text-gray-500">{a.old_status || "-"} → {a.new_status}</span>{a.catatan && (<><br/><span className="text-xs text-indigo-600">📝 {a.catatan}</span></>)}</div>)}
    </div>
  </div>;
}
