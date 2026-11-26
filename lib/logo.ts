// Logo otomatis: nama akun dicocokkan ke situs resminya, ikonnya diambil dari layanan favicon Google.
// Bisa ditimpa lewat kolom `logo` (alamat situs, misal jago.com, atau URL gambar).
const FAV = (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=128`;
const KNOWN: [RegExp, string][] = [
  [/jago/i, "jago.com"],
  [/\bblu\b/i, "blubybcadigital.id"],
  [/gopay/i, "gopay.co.id"],
  [/\bovo\b/i, "ovo.id"],
  [/\bdana\b/i, "dana.id"],
  [/shopee/i, "shopee.co.id"],
  [/bca/i, "bca.co.id"],
  [/mandiri/i, "bankmandiri.co.id"],
  [/\bbri\b/i, "bri.co.id"],
  [/\bbni\b/i, "bni.co.id"],
  [/seabank/i, "seabank.co.id"],
  [/jenius/i, "jenius.com"],
  [/allo/i, "allobank.com"],
  [/superbank/i, "superbank.id"],
  [/linkaja/i, "linkaja.id"],
];

export function logoUrl(name: string, logo?: string | null): string | null {
  const l = (logo ?? "").trim();
  if (l) return /^(https?:)?\/\//.test(l) || l.startsWith("/") ? l : FAV(l);
  const k = KNOWN.find(([re]) => re.test(name));
  return k ? FAV(k[1]) : null;
}
