export type Tx = { kind: "expense" | "topup"; actor: string; amount: number; pocket: string };

const rp = (s: string) => parseInt(s.replace(/\./g, ""), 10);

// Pola email Jago:
//  "{Nama} melakukan pembayaran sebesar Rp41.000 dari Kantong {X}."
//  "{Nama} menambahkan Rp25.000 ke Kantong {X}."
export function parseJago(raw: string): Tx | null {
  const t = raw.replace(/\s+/g, " ").replace(/^.*?Halo [^,]+,\s*/i, "");
  let m = t.match(/(.+?) melakukan pembayaran sebesar Rp([\d.]+) dari Kantong (.+?)\.(?:\s|$)/);
  if (m) return { kind: "expense", actor: m[1].trim(), amount: rp(m[2]), pocket: m[3].trim() };
  m = t.match(/(.+?) menambahkan Rp([\d.]+) ke Kantong (.+?)\.(?:\s|$)/);
  if (m) return { kind: "topup", actor: m[1].trim(), amount: rp(m[2]), pocket: m[3].trim() };
  return null; // jenis email lain (transfer antar Kantong, dll) → belum dikenali
}
