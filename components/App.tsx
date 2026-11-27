"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Account, Data, Pocket, Tx } from "@/lib/types";
import { MANUAL_CATS } from "@/lib/types";
import AccountForm from "@/components/AccountForm";
import PocketForm from "@/components/PocketForm";
import HomeSettings from "@/components/HomeSettings";

const R = (n: number) => (n < 0 ? "-" : "") + "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");
const PAL = ["#f97316", "#3b82f6", "#a855f7", "#eab308", "#10b981", "#06b6d4", "#ec4899", "#84cc16"];
const col = (s: string) => PAL[[...s].reduce((h, c) => h + c.charCodeAt(0), 0) % PAL.length];
const dl = (d: string) => new Date(d + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const sd = (d: string) => new Date(d + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const pct = (c: number) => `${c < 0 ? "" : "+"}${c.toFixed(2).replace(".", ",")}%`;

const P = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  wal: "M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h14a1 1 0 001-1v-9a1 1 0 00-1-1H5a2 2 0 01-2-2M16 14h2",
  act: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  rep: "M5 20V11M12 20V4M19 20v-6",
  plus: "M12 5v14M5 12h14",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  bell: "M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0",
  set: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  off: "M3 3l18 18M10 6.2A9 9 0 0112 6c6 0 10 6 10 6a17 17 0 01-3 3.5M6.5 7.5C3.8 9.3 2 12 2 12s4 7 10 7c1.4 0 2.7-.3 3.8-.8",
  pen: "M4 20h4L19 9l-4-4L4 16v4z",
  cam: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  mic: "M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM6 12a6 6 0 0012 0M12 18v3",
};
const Ic = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const TABS = [["home", "Beranda"], ["wal", "Dompet"], ["act", "Aktivitas"], ["rep", "Laporan"]] as const;
type Tab = (typeof TABS)[number][0];

function Avatar({ name, color, logo }: { name: string; color: string; logo?: string }) {
  const [bad, setBad] = useState(false);
  if (logo && !bad) return <img className="lg" src={logo} alt="" width={38} height={38} referrerPolicy="no-referrer" onLoad={(e) => e.currentTarget.naturalWidth <= 16 && setBad(true)} onError={() => setBad(true)} />;
  return <i style={{ background: color + "33", color }}>{name[0]}</i>;
}

function Asset({ a, M, onClick, child }: { a: Account; M: (n: number) => string; onClick: () => void; child?: boolean }) {
  return (
    <button className="tx" style={{ width: "100%" }} onClick={onClick} aria-label={`Ubah ${a.name}`}>
      <Avatar name={a.name} color={a.color} logo={a.logo} />
      <div><b>{child ? a.sub || a.name : a.name}</b><small>{child ? a.type : `${a.type} · ${a.sub}`}</small></div>
      <em>{M(a.value)}{a.market && <small className={a.change < 0 ? "dn" : "up"}>{pct(a.change)}</small>}</em>
    </button>
  );
}

function Rows({ rows, name }: { rows: Tx[]; name: (id: string) => string }) {
  const g: Record<string, Tx[]> = {};
  rows.forEach((t) => (g[t.date] ||= []).push(t));
  const days = Object.keys(g).sort().reverse();
  if (!days.length) return <p className="c mute">Belum ada transaksi.</p>;
  return (
    <>
      {days.map((d) => (
        <div key={d}>
          <p className="gh"><span>{dl(d)}</span><span>Total {R(g[d].reduce((s, t) => s + t.amount, 0))}</span></p>
          {g[d].map((t) => (
            <div className="tx" key={t.id}>
              <i style={{ background: col(t.cat) + "22", color: col(t.cat) }}>{t.cat[0]}</i>
              <div><b>{t.title}</b><small>{name(t.acc)} · {t.cat}</small></div>
              <em className={t.amount < 0 ? "dn" : "up"}>{t.amount < 0 ? "-" : "+"} {R(Math.abs(t.amount))}</em>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Form({ accs, onClose, onSaved }: { accs: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [acc, setAcc] = useState(accs[0]?.id ?? "");
  const [cat, setCat] = useState(MANUAL_CATS[0]);
  const [amt, setAmt] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  async function save() {
    if (!(+amt > 0)) return setErr("Isi nominal dulu");
    const r = await fetch("/api/tx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: acc, category: cat, kind, amount: +amt, title }) });
    if (!r.ok) return setErr("Gagal menyimpan. Coba lagi.");
    onSaved();
  }
  if (!accs.length)
    return (
      <>
        <h3 style={{ marginTop: 0 }}>Catat transaksi</h3>
        <p className="mute">Belum ada akun manual. Tambahkan akun tunai atau e-wallet lewat tombol + Tambah akun di tab Dompet. Transaksi Bank Jago masuk otomatis dari email.</p>
        <button className="btn" onClick={onClose}>Tutup</button>
      </>
    );
  return (
    <>
      <h3 style={{ marginTop: 0 }}>Catat transaksi</h3>
      <div className="seg">
        <button className={kind === "expense" ? "on" : ""} onClick={() => setKind("expense")}>Pengeluaran</button>
        <button className={kind === "income" ? "on" : ""} onClick={() => setKind("income")}>Pemasukan</button>
      </div>
      <label htmlFor="fa">Akun</label>
      <select id="fa" value={acc} onChange={(e) => setAcc(e.target.value)}>{accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <label htmlFor="fk">Kategori</label>
      <select id="fk" value={cat} onChange={(e) => setCat(e.target.value)}>{MANUAL_CATS.map((c) => <option key={c}>{c}</option>)}</select>
      <label htmlFor="fv">Nominal (Rp)</label>
      <input id="fv" type="number" inputMode="numeric" placeholder="250000" value={amt} onChange={(e) => { setAmt(e.target.value); setErr(""); }} />
      <div className="chips">{[10, 20, 50, 100].map((n) => <button key={n} onClick={() => setAmt(String((+amt || 0) + n * 1000))}>+{n}rb</button>)}</div>
      {err && <p className="dn" style={{ margin: "6px 0 0", fontSize: 12 }}>{err}</p>}
      <label htmlFor="ft">Judul</label>
      <input id="ft" placeholder="Makan siang, bensin, kopi" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="two"><button className="btn" onClick={onClose}>Batal</button><button className="btn pr" onClick={save}>Simpan</button></div>
    </>
  );
}

export default function App({ data }: { data: Data }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [hide, setHide] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [ym, setYm] = useState<[number, number]>(() => { const [y, m] = data.end.split("-").map(Number); return [y, m]; });
  const [sel, setSel] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"menu" | "form" | "acc" | "pk" | "home" | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const [editingPk, setEditingPk] = useState<Pocket | null>(null);
  const [pkName, setPkName] = useState("");
  const [toast, setToast] = useState("");
  const [quotes, setQuotes] = useState<Record<string, { p: number; c: number }>>({});

  useEffect(() => {
    const prices = () => fetch("/api/prices").then((r) => (r.ok ? r.json() : null)).then((q) => q && setQuotes(q)).catch(() => {});
    const a = setInterval(prices, 30000);
    const b = setInterval(() => router.refresh(), 60000); // tarik email Jago baru
    return () => { clearInterval(a); clearInterval(b); };
  }, [router]);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const openAcc = (a: Account | null) => { setEditing(a); setSheet("acc"); };
  const openPk = (k: Pocket | null, preset = "") => { setEditingPk(k); setPkName(preset); setSheet("pk"); };
  const done = (m: string) => { setSheet(null); router.refresh(); say(m); };

  const accs = data.accounts.map((a) => {
    if (!a.market) return a;
    const q = quotes[a.key];
    return { ...a, value: a.qty * (q?.p ?? a.price) || a.value, change: q?.c ?? a.change };
  });
  const total = accs.reduce((s, a) => s + a.value, 0);
  const M = (n: number) => (hide ? "Rp ••••••" : R(n));
  const name = (id: string) => accs.find((a) => a.id === id)?.name ?? "Akun";
  const cyc = data.txs.filter((t) => t.date >= data.start && t.date <= data.end);
  const inc = cyc.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const exp = -cyc.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const period = `${sd(data.start)} – ${sd(data.end)}`;
  const theme = () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  };
  const grad = (c: string) => `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 55%, #000))`;

  // Pengelompokan Dompet: kripto jadi satu grup, akun dengan nama bank yang sama digabung,
  // dan Bank Jago berisi Kantong-kantongnya.
  const gk = (a: Account) => (a.type === "crypto" ? "§crypto" : a.name.toLowerCase());
  const items: { key: string; ms: Account[] }[] = [];
  accs.forEach((a) => { const k = gk(a); if (!items.some((i) => i.key === k)) items.push({ key: k, ms: accs.filter((x) => gk(x) === k) }); });
  const info = ({ key, ms }: { key: string; ms: Account[] }) => {
    const crypto = key === "§crypto";
    const jago = ms.some((a) => a.id === "jago");
    const sum = ms.reduce((s, a) => s + a.value, 0);
    const prev = ms.reduce((s, a) => s + a.value / (1 + (a.market ? a.change : 0) / 100), 0);
    return {
      crypto, jago, group: crypto || jago || ms.length > 1, sum, chg: prev ? (sum / prev - 1) * 100 : 0, first: ms[0],
      title: crypto ? "Kripto" : ms[0].name,
      label: crypto ? `${ms.length} koin` : jago ? `${data.pockets.length} Kantong` : `${ms.length} akun`,
    };
  };
  const pocketRow = (k: Pocket) => (
    <button key={k.name} className="tx" style={{ width: "100%" }} onClick={() => openPk(k)} aria-label={`Sesuaikan saldo ${k.name}`}>
      <i style={{ background: col(k.name) + "22", color: col(k.name) }}>{k.name[0]}</i>
      <div><b>{k.name}</b><small>{M(k.perDay)} / hari</small></div>
      <em>{M(k.bal)}<small className={k.warn ? "dn" : "up"}>{k.warn ? "Lebih cepat dari waktu" : "Aman"}</small></em>
    </button>
  );
  const pinned = data.pockets.filter((k) => data.home.pockets.includes(k.name));

  const [ey, em] = ym;
  const shift = (d: number) => { const t = new Date(ey, em - 1 + d, 1); setYm([t.getFullYear(), t.getMonth() + 1]); setSel(null); };
  const lead = (new Date(ey, em - 1, 1).getDay() + 6) % 7;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const mk = `${ey}-${String(em).padStart(2, "0")}`;
  const actRows = data.txs.filter((t) => (sel ? t.date === sel : t.date.startsWith(mk)));

  const cats: Record<string, number> = {};
  cyc.filter((t) => t.amount < 0).forEach((t) => (cats[t.cat] = (cats[t.cat] || 0) - t.amount));
  const ctot = Object.values(cats).reduce((a, b) => a + b, 0);
  let off = 25;

  const tabBtn = ([k, l]: readonly [Tab, string]) => (
    <button key={k} className={k === tab ? "on" : ""} onClick={() => setTab(k)}><Ic d={P[k]} /><span>{l}</span></button>
  );

  return (
    <>
      <div id="app">
        {tab === "home" && (
          <>
            <div className="top">
              <button className="ib" onClick={theme} aria-label="Ganti tema"><Ic d={P.user} /></button>
              <span className="pill">{period}</span>
              {data.isAdmin
                ? <button className="ib" onClick={() => setSheet("home")} aria-label="Atur Beranda"><Ic d={P.set} /></button>
                : <button className="ib" aria-label="Notifikasi"><Ic d={P.bell} /></button>}
            </div>
            <p className="c mute">Total aset</p>
            <h1 className="c">{M(total)}</h1>
            <p className="c"><span className="chip">{data.daysLeft} hari lagi sampai gajian</span></p>
            {data.home.summary && (
              <section className="card">
                <h3>Keuangan Anda</h3>
                <div className="two" style={{ margin: 0 }}>
                  <div className="tile"><small>Pemasukan</small><b className="up">{R(inc)}</b></div>
                  <div className="tile"><small>Pengeluaran</small><b className="dn">{R(exp)}</b></div>
                </div>
                <button className="row" onClick={() => setTab("rep")}><span>Ringkasan analisis siap</span><span>Lihat ›</span></button>
              </section>
            )}
            {pinned.length > 0 && (
              <>
                <h3>Kantong</h3>
                <div className="pk">
                  {pinned.map((k) => (
                    <button key={k.name} className={"pc" + (k.warn ? " w" : "")} style={{ width: "100%" }} onClick={() => openPk(k)} aria-label={`Sesuaikan saldo ${k.name}`}>
                      <div className="t"><span className="n">{k.name}</span><b>{M(k.bal)}</b></div>
                      <div className="bar"><i style={{ width: `${k.frac * 100}%` }} /><b style={{ left: `${data.timeFrac * 100}%` }} /></div>
                      <div className="r"><span>{M(k.perDay)} / hari</span><span className={k.warn ? "dn" : "up"}>{k.warn ? "Lebih cepat dari waktu" : "Aman"}</span></div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {data.home.txs && (
              <>
                <h3>Transaksi</h3>
                <Rows rows={data.txs.slice(0, 8)} name={name} />
              </>
            )}
          </>
        )}

        {tab === "wal" && (
          <>
            <div className="top"><h2>Dompet</h2></div>
            <small>Total saldo semua akun</small>
            <h1>{M(total)}</h1>
            <div className="sc">
              {items.map((it) => {
                const g = info(it);
                return (
                  <div className="ac" key={it.key} style={{ background: grad(g.crypto ? "#a855f7" : g.first.color) }}>
                    <div className="t">
                      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Avatar name={g.title} color="#ffffff" logo={g.crypto ? "" : g.first.logo} />
                        <b style={{ fontSize: 15 }}>{g.title}</b>
                      </span>
                      <small>{g.group ? g.label : g.first.type}</small>
                    </div>
                    <small>{g.group ? "" : g.first.sub}</small>
                    <div className="t"><b>{M(g.sum)}</b><button className="ib s" onClick={() => setHide(!hide)} aria-label="Tampilkan atau sembunyikan saldo"><Ic d={hide ? P.off : P.eye} /></button></div>
                  </div>
                );
              })}
            </div>
            <p className="gh"><b>Daftar akun dan aset</b><button className="chip" onClick={() => openAcc(null)}>+ Tambah akun</button></p>
            {items.map((it) => {
              const g = info(it);
              if (!g.group) return <Asset key={it.key} a={g.first} M={M} onClick={() => openAcc(g.first)} />;
              return (
                <div key={it.key}>
                  <button className="tx" style={{ width: "100%" }} onClick={() => setOpen({ ...open, [it.key]: !open[it.key] })} aria-expanded={!!open[it.key]}>
                    {g.crypto ? <Avatar name="Kripto" color="#a855f7" /> : <Avatar name={g.first.name} color={g.first.color} logo={g.first.logo} />}
                    <div><b>{g.title}</b><small>{g.label} · {open[it.key] ? "ketuk untuk tutup" : "ketuk untuk lihat"}</small></div>
                    <em>{M(g.sum)}{g.crypto && <small className={g.chg < 0 ? "dn" : "up"}>{pct(g.chg)}</small>}</em>
                  </button>
                  {open[it.key] && (
                    <div style={{ marginLeft: 16 }}>
                      {g.jago && data.pockets.map(pocketRow)}
                      {g.jago && data.untracked.map((n) => (
                        <button key={n} className="tx" style={{ width: "100%" }} onClick={() => openPk(null, n)}>
                          <i style={{ background: col(n) + "22", color: col(n) }}>{n[0]}</i>
                          <div><b>{n}</b><small>Terdeteksi di email Jago, belum terdaftar</small></div>
                          <em className="dn">Isi saldo</em>
                        </button>
                      ))}
                      {g.jago && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <button className="chip" onClick={() => openPk(null)}>+ Tambah Kantong</button>
                          <button className="chip" onClick={() => openAcc(it.ms.find((a) => a.id === "jago") ?? null)}>Ubah akun {g.title}</button>
                        </div>
                      )}
                      {it.ms.filter((a) => a.id !== "jago").map((a) => <Asset key={a.id} a={a} M={M} child={!g.crypto} onClick={() => openAcc(a)} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === "act" && (
          <>
            <div className="top">
              <h2>Aktivitas</h2>
              <div className="mnav">
                <button className="ib" style={{ fontSize: 20 }} onClick={() => shift(-1)} aria-label="Bulan sebelumnya">‹</button>
                <span className="pill">{new Date(ey, em - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                <button className="ib" style={{ fontSize: 20 }} onClick={() => shift(1)} aria-label="Bulan berikutnya">›</button>
              </div>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div className="cal">
                {["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"].map((x) => <span key={x}>{x}</span>)}
                {Array.from({ length: lead }, (_, i) => <i key={"b" + i} />)}
                {Array.from({ length: new Date(ey, em, 0).getDate() }, (_, i) => {
                  const k = `${mk}-${String(i + 1).padStart(2, "0")}`;
                  return (
                    <button key={k} className={"d" + (sel === k ? " on" : "") + (k === today ? " td" : "")} onClick={() => setSel(k)} aria-label={dl(k)}>
                      {i + 1}{data.txs.some((t) => t.date === k) && <u />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="two">
              <div className="tile"><small>Pengeluaran</small><b className="dn">{R(-actRows.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))}</b></div>
              <div className="tile"><small>Pemasukan</small><b className="up">{R(actRows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))}</b></div>
            </div>
            {sel && <p className="gh"><span>{dl(sel)}</span><button className="chip" onClick={() => setSel(null)}>Semua tanggal ×</button></p>}
            <Rows rows={actRows} name={name} />
          </>
        )}

        {tab === "rep" && (
          <>
            <div className="top"><h2>Laporan analisis</h2><span className="pill">{period}</span></div>
            <div className="dnt">
              <svg viewBox="0 0 42 42" role="img" aria-label="Diagram pengeluaran per kategori">
                {Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                  const p = (v / ctot) * 100;
                  const el = <circle key={k} r="15.9155" cx="21" cy="21" fill="none" stroke={col(k)} strokeWidth="5" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={off} />;
                  off -= p;
                  return el;
                })}
              </svg>
              <div><small>Pengeluaran</small><b style={{ fontSize: 18 }}>{R(ctot)}</b></div>
            </div>
            <p className="gh"><span>Semua pengeluaran</span><span>Total {R(ctot)}</span></p>
            {Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div className="tx" key={k}>
                <i style={{ background: col(k) + "22", color: col(k) }}>{k[0]}</i>
                <div><b>{k}</b><small>{Math.round((v / ctot) * 100)}% dari total</small><div className="pb"><u style={{ width: `${(v / ctot) * 100}%`, background: col(k) }} /></div></div>
                <em>{R(v)}</em>
              </div>
            ))}
            {!ctot && <p className="c mute">Belum ada pengeluaran di siklus ini.</p>}
          </>
        )}
      </div>

      <nav>
        {TABS.slice(0, 2).map(tabBtn)}
        <button className="fab" onClick={() => setSheet("menu")} aria-label="Catat transaksi"><Ic d={P.plus} /></button>
        {TABS.slice(2).map(tabBtn)}
      </nav>

      {sheet && (
        <div className="ov" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="sheet">
            {sheet === "menu" && (
              <>
                <h3 style={{ marginTop: 0 }}>Catat transaksi</h3>
                <div className="fm">
                  <button onClick={() => setSheet("form")}><Ic d={P.pen} /><span>Catat manual</span></button>
                  <button onClick={() => say("Foto struk menyusul")}><Ic d={P.cam} /><span>Foto struk</span></button>
                  <button onClick={() => say("Catat lewat suara menyusul")}><Ic d={P.mic} /><span>Suara</span></button>
                  <button onClick={() => openAcc(null)}><Ic d={P.wal} /><span>Tambah akun atau aset</span></button>
                </div>
              </>
            )}
            {sheet === "form" && <Form accs={accs.filter((a) => !a.market && a.id !== "jago")} onClose={() => setSheet(null)} onSaved={() => done("Transaksi disimpan")} />}
            {sheet === "acc" && <AccountForm acc={editing} onClose={() => setSheet(null)} onSaved={done} />}
            {sheet === "pk" && <PocketForm pocket={editingPk} presetName={pkName} onClose={() => setSheet(null)} onSaved={done} />}
            {sheet === "home" && data.isAdmin && <HomeSettings home={data.home} pockets={data.pockets} onClose={() => setSheet(null)} onSaved={done} />}
          </div>
        </div>
      )}
      <div id="toast" className={toast ? "s" : ""} role="status">{toast}</div>
    </>
  );
}
