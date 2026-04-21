import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import nodemailer from 'nodemailer'
import prisma from './prisma'

// In-memory rate limiter (resets on process restart; sufficient for single-process deployments)
const rateLimitStore = new Map() // key -> [timestamp, ...]

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now()
  const timestamps = (rateLimitStore.get(key) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= maxRequests) return false
  timestamps.push(now)
  rateLimitStore.set(key, timestamps)
  return true
}

async function sendMagicLinkEmail({ url, identifier, provider }) {
  const transport = nodemailer.createTransport(provider.server)
  await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: 'Sign in to ilovejson',
    text: `Sign in to ilovejson\n\nClick this link to sign in (expires in 10 minutes):\n${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#1f2937">
        <h2 style="color:#4f46e5">Sign in to ilovejson</h2>
        <p>Click the button below to sign in. This link expires in 10 minutes.</p>
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Sign in</a>
        <p style="font-size:13px;color:#6b7280">Or copy this link: <a href="${url}" style="color:#4f46e5">${url}</a></p>
        <p style="font-size:12px;color:#9ca3af">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

const providers = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60,
      async sendVerificationRequest({ identifier: email, url, provider, request }) {
        const ip = request?.headers?.['x-forwarded-for'] || request?.socket?.remoteAddress || 'unknown'
        // 5 per email per hour, 20 per IP per hour
        if (!checkRateLimit(`email:${email}`, 5, 60 * 60 * 1000)) {
          throw new Error('Too many sign-in requests for this email. Please wait before trying again.')
        }
        if (ip !== 'unknown' && !checkRateLimit(`ip:${ip}`, 20, 60 * 60 * 1000)) {
          throw new Error('Too many sign-in requests from this IP. Please wait before trying again.')
        }
        await sendMagicLinkEmail({ url, identifier: email, provider })
      },
    })
  )
} else if (process.env.NODE_ENV !== 'production') {
  // Dev transport: logs magic link to console, no email credentials required
  providers.push(
    EmailProvider({
      server: { host: 'localhost', port: 1025, auth: { user: 'dev', pass: 'dev' } },
      from: 'dev@localhost',
      maxAge: 10 * 60,
      sendVerificationRequest({ identifier, url }) {
        console.log(`\n✉️  Magic link for ${identifier} (dev):\n${url}\n`)
      },
    })
  )
}

export const authOptions = {
  adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: process.env.DATABASE_URL ? 'database' : 'jwt',
  },
  callbacks: {
    session({ session, user }) {
      if (user) {
        session.user.id = user.id
      }
      return session
    },
  },
}
