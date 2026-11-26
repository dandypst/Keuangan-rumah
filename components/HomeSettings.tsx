"use client";
import { useState } from "react";
import type { Home, Pocket } from "@/lib/types";

export default function HomeSettings({ home, pockets, onClose, onSaved }: { home: Home; pockets: Pocket[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const [h, setH] = useState<Home>(home);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (n: string) => setH({ ...h, pockets: h.pockets.includes(n) ? h.pockets.filter((x) => x !== n) : [...h.pockets, n] });

  async function save() {
    setBusy(true);
    const r = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(h) });
    setBusy(false);
    if (!r.ok) return setErr("Gagal menyimpan. Pastikan tabel settings sudah dibuat.");
    onSaved("Tampilan Beranda disimpan");
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>Atur Beranda</h3>
      <p className="mute" style={{ fontSize: 12 }}>Berlaku untuk semua pengguna. Hanya admin yang bisa mengubahnya.</p>
      <label className="chk"><input type="checkbox" checked={h.summary} onChange={(e) => setH({ ...h, summary: e.target.checked })} />Ringkasan pemasukan dan pengeluaran</label>
      <label className="chk"><input type="checkbox" checked={h.txs} onChange={(e) => setH({ ...h, txs: e.target.checked })} />Transaksi terbaru</label>
      <p className="gh"><b>Kantong yang ditampilkan di Beranda</b></p>
      {pockets.map((k) => (
        <label className="chk" key={k.name}><input type="checkbox" checked={h.pockets.includes(k.name)} onChange={() => toggle(k.name)} />{k.name}</label>
      ))}
      {err && <p className="dn" style={{ margin: "6px 0 0", fontSize: 12 }}>{err}</p>}
      <div className="two">
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn pr" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
      </div>
    </>
  );
}
