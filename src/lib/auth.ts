import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyLoginPassword } from "./passwords";
import { initializeDb } from "./init-db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        await initializeDb();
        const valid = await verifyLoginPassword(credentials.password as string);
        if (valid) return { id: "1", name: "owner" };
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
});
