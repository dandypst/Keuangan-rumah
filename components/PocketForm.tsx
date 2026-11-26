"use client";
import { useState } from "react";
import type { Pocket } from "@/lib/types";

export default function PocketForm({ pocket, onClose, onSaved }: { pocket: Pocket | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const edit = !!pocket;
  const [name, setName] = useState(pocket?.name ?? "");
  const [bal, setBal] = useState(pocket ? String(Math.round(pocket.bal)) : "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const digits = bal.replace(/[^\d]/g, "");
    if (!name.trim()) return setErr("Isi nama Kantong dulu");
    if (!digits) return setErr("Isi saldonya dulu");
    setBusy(true);
    const r = await fetch("/api/pockets", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), balance: Number(digits) }),
    });
    setBusy(false);
    if (!r.ok) return setErr(edit ? "Gagal menyimpan. Coba lagi." : "Gagal menyimpan. Mungkin nama Kantong itu sudah ada.");
    onSaved(edit ? "Saldo Kantong diperbarui" : "Kantong ditambahkan");
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{edit ? "Sesuaikan saldo Kantong" : "Tambah Kantong"}</h3>
      <label htmlFor="pn">Nama Kantong</label>
      <input id="pn" value={name} disabled={edit} placeholder="Persis seperti nama di app Jago" onChange={(e) => setName(e.target.value)} />
      <label htmlFor="pb">Saldo sekarang (Rp)</label>
      <input id="pb" type="text" inputMode="numeric" placeholder="0" value={bal} onChange={(e) => { setBal(e.target.value); setErr(""); }} />
      <p className="mute" style={{ fontSize: 12 }}>Isi sesuai saldo Kantong di app Jago saat ini. Perubahan berikutnya dihitung otomatis dari email Jago.</p>
      {err && <p className="dn" style={{ margin: "6px 0 0", fontSize: 12 }}>{err}</p>}
      <div className="two">
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn pr" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
      </div>
    </>
  );
}
