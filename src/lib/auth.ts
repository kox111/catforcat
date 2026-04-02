import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTOTP } from "./two-factor";
import { checkRateLimit } from "./rate-limit";

// Build OAuth providers conditionally based on env vars
const oauthProviders: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (
  process.env.APPLE_ID &&
  process.env.APPLE_CLIENT_SECRET
) {
  oauthProviders.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
}

// Only use PrismaAdapter when OAuth providers are configured.
// The adapter is needed to store OAuth Account records.
// Session strategy stays "jwt" regardless.
const useAdapter = oauthProviders.length > 0;

export const authOptions: NextAuthOptions = {
  ...(useAdapter && { adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"] }),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpToken: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const rateLimit = await checkRateLimit(
          `login:${credentials.email.toLowerCase()}`,
          5,
          900_000,
        );
        if (!rateLimit.allowed) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) {
          return null;
        }

        if (user.twoFactorEnabled) {
          if (!credentials.totpToken) {
            throw new Error("2FA_REQUIRED");
          }
          if (!user.twoFactorSecret) {
            throw new Error("2FA_INVALID");
          }
          const isTotpValid = verifyTOTP(
            user.twoFactorSecret,
            credentials.totpToken,
          );
          if (!isTotpValid) {
            throw new Error("2FA_INVALID");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...oauthProviders,
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth account linking for Google/Apple
      if (account?.provider === "google" || account?.provider === "apple") {
        if (!user.email) return true;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Link the OAuth account to the existing user if not already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token as string | undefined,
                access_token: account.access_token as string | undefined,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token as string | undefined,
                session_state: account.session_state as string | undefined,
              },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
