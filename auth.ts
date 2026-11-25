import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { enc } from "@/lib/crypto";

const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
const owner = (process.env.OWNER_EMAIL ?? "").toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    signIn: ({ profile }) => allowed.includes((profile?.email ?? "").toLowerCase()),
    async jwt({ token, account }) {
      // Hanya mailbox owner yang disimpan token-nya (refresh token terenkripsi).
      if (account?.refresh_token && token.email?.toLowerCase() === owner) {
        await db.from("google_tokens").upsert({
          email: owner,
          refresh_token_enc: enc(account.refresh_token),
          updated_at: new Date().toISOString(),
        });
      }
      return token;
    },
  },
});
