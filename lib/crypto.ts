import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const key = () => {
  if (!process.env.TOKEN_KEY) throw new Error("TOKEN_KEY belum diisi di environment variables");
  return createHash("sha256").update(process.env.TOKEN_KEY).digest();
};

export function enc(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}

export function dec(data: string) {
  const b = Buffer.from(data, "base64");
  const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}
