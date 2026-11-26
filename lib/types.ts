export type Account = {
  id: string; name: string; type: string; sub: string; color: string;
  market: boolean; symbol: string; qty: number; price: number; change: number; key: string; value: number;
};
export type Pocket = { name: string; bal: number; perDay: number; frac: number; warn: boolean };
export type Tx = { id: number; date: string; title: string; cat: string; acc: string; amount: number };
export type Data = {
  accounts: Account[]; pockets: Pocket[]; txs: Tx[];
  timeFrac: number; daysLeft: number; start: string; end: string;
};
export const MANUAL_CATS = ["Makan", "Transportasi", "Belanja", "Tagihan", "Gaji", "Investasi", "Lainnya"];
