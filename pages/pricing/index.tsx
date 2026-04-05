"use client"

import { Header } from "@components/Header"
import { Footer } from "@components/Footer"
import { Check, Zap, Crown, Sparkles, ArrowRight, Shield, Clock, Server } from "lucide-react"
import Link from "next/link"
import Head from "next/head"

const plans = [
  {
    name: "Free",
    description: "Everything you need, completely free",
    price: { monthly: 0, yearly: 0 },
    popular: true,
    features: [
      "All 20+ conversion tools",
      "All utility tools (diff, merge, query, faker)",
      "Up to 100MB file size",
      "20 requests per minute",
      "Keyboard shortcuts",
      "No signup required",
    ],
    limitations: [],
    cta: "Start Converting",
    ctaHref: "/",
    icon: Zap,
    color: "from-red-500 to-rose-600",
  },
  {
    name: "Pro",
    description: "Coming soon for power users",
    price: { monthly: 9.99, yearly: 79 },
    popular: false,
    features: [
      "Everything in Free",
      "REST API access",
      "Higher rate limits",
      "Batch processing",
      "Priority support",
    ],
    limitations: [],
    cta: "Coming Soon",
    ctaHref: "#",
    icon: Crown,
    color: "from-slate-500 to-slate-600",
  },
]

const faqs = [
  {
    q: "Is I Love JSON really free?",
    a: "Yes! All tools are completely free with no signup required. We plan to offer a Pro tier in the future for power users who need API access and higher limits.",
  },
  {
    q: "What happens to my files after processing?",
    a: "Files are automatically deleted within minutes of processing. We do not store or analyze your data.",
  },
  {
    q: "Are there any usage limits?",
    a: "Free users can make 20 requests per minute with files up to 100MB. This is plenty for individual use.",
  },
  {
    q: "When will Pro be available?",
    a: "We are actively building the Pro tier with API access and batch processing. Sign up for updates on our GitHub.",
  },
]

export default function PricingPage() {

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

            {/* Billing note */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary rounded-full text-sm text-muted-foreground">
              Pro pricing coming soon
              <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">
                Free today
              </span>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="max-w-6xl mx-auto px-4 mb-24">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-foreground">
                        {plan.price.monthly === 0 ? "Free" : `$${plan.price.monthly}`}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
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
