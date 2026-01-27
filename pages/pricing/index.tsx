"use client"

import { useState } from "react"
import { Header } from "@components/Header"
import { Footer } from "@components/Footer"
import { Check, Zap, Crown, Sparkles, ArrowRight, Shield, Clock, Server } from "lucide-react"
import Link from "next/link"
import Head from "next/head"

const plans = [
  {
    name: "Free",
    description: "Perfect for occasional use",
    price: { monthly: 0, yearly: 0 },
    popular: false,
    features: [
      "All basic conversions",
      "Up to 5MB file size",
      "20 conversions per day",
      "Standard processing speed",
      "Files deleted after 1 hour",
      "Community support",
    ],
    limitations: [
      "Ads displayed",
      "No batch processing",
      "No API access",
    ],
    cta: "Get Started Free",
    ctaHref: "/api/auth/signin",
    icon: Zap,
    color: "from-slate-500 to-slate-600",
  },
  {
    name: "Pro",
    description: "For power users and developers",
    price: { monthly: 9.99, yearly: 79 },
    popular: true,
    features: [
      "Everything in Free",
      "100MB file size limit",
      "Unlimited conversions",
      "Priority processing",
      "No ads",
      "Files stored for 7 days",
      "API access (10,000 req/mo)",
      "Batch processing (50 files)",
      "Custom workflows (10 saved)",
      "Email support",
    ],
    limitations: [],
    cta: "Start Pro Trial",
    ctaHref: "/api/auth/signin?plan=pro",
    icon: Crown,
    color: "from-red-500 to-rose-600",
  },
  {
    name: "Lifetime",
    description: "One-time payment, forever access",
    price: { monthly: 199, yearly: 199 },
    popular: false,
    isLifetime: true,
    features: [
      "Everything in Pro, forever",
      "No recurring payments",
      "Early adopter badge",
      "Priority feature requests",
      "Exclusive Discord access",
      "Future features included",
    ],
    limitations: [],
    cta: "Get Lifetime Access",
    ctaHref: "/api/auth/signin?plan=lifetime",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
  },
]

const apiPlans = [
  { name: "Starter", requests: "5,000", price: 19 },
  { name: "Growth", requests: "50,000", price: 49 },
  { name: "Scale", requests: "500,000", price: 199 },
]

const faqs = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "What happens to my files after processing?",
    a: "Free users' files are deleted after 1 hour. Pro users' files are stored for 7 days. You can manually delete files anytime.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes! Pro comes with a 7-day free trial. No credit card required to start.",
  },
  {
    q: "What's included in the Lifetime deal?",
    a: "Lifetime includes everything in Pro, forever. No recurring payments, and you get all future features and updates.",
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")

  return (
    <>
      <Head>
        <title>Pricing - I Love JSON</title>
        <meta name="description" content="Simple, transparent pricing for I Love JSON. Start free and upgrade when you need more." />
      </Head>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-12 pb-24">
          {/* Hero */}
          <section className="text-center px-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 text-balance">
              Choose your plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Start free and upgrade when you need more. Handle what AI can't: large files, batch processing, and guaranteed privacy.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 bg-secondary rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">
                  Save 34%
                </span>
              </button>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="max-w-6xl mx-auto px-4 mb-24">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {plans.map((plan, idx) => (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? "bg-gradient-to-b from-red-500/5 to-transparent border-2 border-red-500/20 shadow-xl shadow-red-500/5"
                      : "bg-card border border-border hover:border-border/80 hover:shadow-lg"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/25">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    {plan.isLifetime ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-foreground">${plan.price.monthly}</span>
                        <span className="text-muted-foreground">one-time</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-foreground">
                          ${billingCycle === "yearly" ? Math.round(plan.price.yearly / 12) : plan.price.monthly}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                    {!plan.isLifetime && plan.price.yearly > 0 && billingCycle === "yearly" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Billed ${plan.price.yearly}/year
                      </p>
                    )}
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 mb-8 group ${
                      plan.popular
                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-start gap-3 opacity-50">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-2 h-0.5 bg-muted-foreground rounded-full" />
                        </div>
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* API Pricing */}
          <section className="max-w-4xl mx-auto px-4 mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">API Pricing</h2>
              <p className="text-muted-foreground">Build powerful integrations with our REST API</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {apiPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <h3 className="text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-3xl font-black text-foreground mb-1">${plan.price}</p>
                  <p className="text-sm text-muted-foreground mb-4">/month</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{plan.requests}</span> requests/month
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Features Grid */}
          <section className="max-w-5xl mx-auto px-4 mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Why upgrade to Pro?</h2>
              <p className="text-muted-foreground">Handle what AI and other tools can't</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">100MB File Support</h3>
                <p className="text-sm text-muted-foreground">Process large JSON files that AI chatbots simply can't handle</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Batch Processing</h3>
                <p className="text-sm text-muted-foreground">Convert up to 50 files at once with automated workflows</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">Your data stays private - no training, no sharing, no exceptions</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}
