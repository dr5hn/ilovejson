import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import AzureADProvider from 'next-auth/providers/azure-ad';
import prisma from '@lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    }),
  ].filter(provider => {
    // Only include providers that have credentials configured
    if (provider.id === 'google') {
      return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    }
    if (provider.id === 'github') {
      return process.env.GITHUB_ID && process.env.GITHUB_SECRET;
    }
    if (provider.id === 'azure-ad') {
      return process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET;
    }
    return false;
  }),
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
