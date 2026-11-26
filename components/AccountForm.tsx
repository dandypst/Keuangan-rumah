"use client";
import { useEffect, useState } from "react";
import type { Account } from "@/lib/types";

const TYPES = [["bank", "Bank"], ["ewallet", "E-wallet"], ["cash", "Tunai"], ["crypto", "Kripto"], ["stock", "Saham"], ["gold", "Emas"]] as const;
type Hit = { id: string; name: string; symbol: string };

export default function AccountForm({ acc, onClose, onSaved }: { acc: Account | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const edit = !!acc;
  const derived = acc?.id === "jago"; // saldo dihitung dari Kantong
  const [type, setType] = useState<string>(acc?.type ?? "bank");
  const [name, setName] = useState(acc?.name ?? "");
  const [sub, setSub] = useState(acc?.sub ?? "");
  const [symbol, setSymbol] = useState(acc?.symbol ?? "");
  const [num, setNum] = useState(acc ? String(acc.market ? acc.qty : Math.round(acc.value)) : "");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const market = ["crypto", "stock", "gold"].includes(type);

  useEffect(() => {
    if (type !== "crypto" || edit || q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => fetch(`/api/coins?q=${encodeURIComponent(q.trim())}`).then((r) => (r.ok ? r.json() : [])).then(setHits).catch(() => {}), 350);
    return () => clearTimeout(t);
  }, [q, type, edit]);

  async function save() {
    const n = parseFloat(num.replace(",", "."));
    if (!name.trim()) return setErr("Isi nama dulu");
    if (!derived && !(n >= 0)) return setErr(market ? "Isi jumlahnya dulu" : "Isi saldonya dulu");
    if (!edit && type === "crypto" && !symbol) return setErr("Pilih koinnya dari hasil pencarian");
    if (!edit && type === "stock" && !symbol.trim()) return setErr("Isi kode saham dulu");
    setBusy(true);
    const r = await fetch("/api/accounts", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: acc?.id, type, name: name.trim(), sub: sub.trim(), amount: n, symbol }),
    });
    setBusy(false);
    if (!r.ok) return setErr("Gagal menyimpan. Coba lagi.");
    onSaved(edit ? "Akun diperbarui" : "Akun ditambahkan");
  }

  async function del() {
    if (!confirm(`Hapus ${acc!.name}? Riwayat transaksinya tetap ada.`)) return;
    const r = await fetch(`/api/accounts?id=${encodeURIComponent(acc!.id)}`, { method: "DELETE" });
    if (!r.ok) return setErr("Gagal menghapus.");
    onSaved("Akun dihapus");
  }

  const amountLabel = type === "crypto" ? "Jumlah koin" : type === "stock" ? "Jumlah lembar (1 lot = 100 lembar)" : type === "gold" ? "Berat (gram)" : "Saldo (Rp)";

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{edit ? "Ubah akun" : "Tambah akun atau aset"}</h3>
      <label htmlFor="at">Jenis</label>
      <select id="at" value={type} disabled={edit} onChange={(e) => { setType(e.target.value); setSymbol(""); setHits([]); setErr(""); }}>
        {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      {!edit && type === "crypto" && (
        <>
          <label htmlFor="aq">Cari koin</label>
          <input id="aq" placeholder="Ketik nama atau simbol, misal sui" value={q} onChange={(e) => setQ(e.target.value)} />
          {hits.map((h) => (
            <button key={h.id} className="btn" style={{ textAlign: "left", marginTop: 6, width: "100%" }} onClick={() => { setSymbol(h.id); setName(h.name); setSub(h.symbol.toUpperCase()); setHits([]); setQ(""); }}>
              {h.name} · {h.symbol.toUpperCase()}
            </button>
          ))}
          {symbol && <p className="up" style={{ margin: "6px 0 0", fontSize: 12 }}>Terpilih: {symbol}</p>}
        </>
      )}
      {!edit && type === "stock" && (
        <>
          <label htmlFor="as">Kode saham</label>
          <input id="as" placeholder="BBCA (saham IDX, otomatis jadi BBCA.JK)" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </>
      )}

      <label htmlFor="an">Nama</label>
      <input id="an" placeholder={type === "bank" ? "Bank BCA" : type === "ewallet" ? "GoPay" : "Nama akun"} value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="ak">Keterangan (opsional)</label>
      <input id="ak" placeholder="Tabungan, kebutuhan harian, dan sebagainya" value={sub} onChange={(e) => setSub(e.target.value)} />

      {derived ? (
        <p className="mute" style={{ fontSize: 12 }}>Saldo Bank Jago adalah jumlah semua Kantong. Untuk menyesuaikannya, ketuk Kantong di tab Beranda.</p>
      ) : (
        <>
          <label htmlFor="av">{amountLabel}</label>
          <input id="av" type="text" inputMode="decimal" placeholder="0" value={num} onChange={(e) => { setNum(e.target.value); setErr(""); }} />
        </>
      )}
      {err && <p className="dn" style={{ margin: "6px 0 0", fontSize: 12 }}>{err}</p>}
      <div className="two">
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn pr" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
      </div>
      {edit && !derived && <button className="btn dn" style={{ width: "100%" }} onClick={del}>Hapus akun</button>}
    </>
  );
}
