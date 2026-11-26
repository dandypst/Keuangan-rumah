"use client";
import { useState } from "react";
import type { Pocket } from "@/lib/types";

export default function PocketForm({ pocket, onClose, onSaved }: { pocket: Pocket; onClose: () => void; onSaved: (msg: string) => void }) {
  const [v, setV] = useState(String(Math.round(pocket.bal)));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!v.replace(/\D/g, "")) return setErr("Isi saldonya dulu");
    setBusy(true);
    const r = await fetch("/api/pockets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pocket.name, balance: Number(v.replace(/\D/g, "")) }),
    });
    setBusy(false);
    if (!r.ok) return setErr("Gagal menyimpan. Coba lagi.");
    onSaved("Saldo Kantong disesuaikan");
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>Sesuaikan saldo Kantong</h3>
      <p className="mute" style={{ marginTop: 0 }}>
        Samakan dengan saldo <b>{pocket.name}</b> di app Jago saat ini. Mulai sekarang app menghitung dari angka ini, ditambah transaksi baru yang masuk.
      </p>
      <label htmlFor="pv">Saldo (Rp)</label>
      <input id="pv" type="text" inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value); setErr(""); }} />
      {err && <p className="dn" style={{ margin: "6px 0 0", fontSize: 12 }}>{err}</p>}
      <div className="two">
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn pr" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
      </div>
    </>
  );
}
