import Link from "next/link"
import { ArrowRight, Heart, Users, Zap, Shield } from "lucide-react"

const stats = [
  { icon: Users, value: "100K+", label: "Developers" },
  { icon: Zap, value: "10M+", label: "Conversions" },
  { icon: Shield, value: "99.9%", label: "Uptime" },
]

export function CTASection() {
  return (
    <section className="w-full py-24 bg-gradient-to-br from-foreground via-gray-900 to-foreground text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <stat.icon className="w-5 h-5 text-red-400" />
                <span className="text-3xl md:text-4xl font-black">{stat.value}</span>
              </div>
              <span className="text-sm text-white/60">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur rounded-full text-sm font-medium mb-8 border border-white/10">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            Trusted by developers worldwide
          </div>

          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
            Ready to transform
            <br />
            <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              your workflow?
            </span>
          </h2>

          <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers who use I Love JSON every day to convert, validate, and transform their data
            effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#tools"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-2xl shadow-red-500/30 hover:-translate-y-1 hover:shadow-red-500/40"
            >
              Start Converting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="https://github.com/ilovejson/ilovejson"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
