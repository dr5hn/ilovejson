import { Zap, Shield, Globe, Smartphone, Cpu, Lock } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Convert files instantly with our optimized processing engine. No waiting, no delays.",
    color: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "Your files are processed on our secure servers and automatically deleted after conversion.",
    color: "from-emerald-500 to-green-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "Access from any device, any browser, anywhere in the world. No installation needed.",
    color: "from-blue-500 to-indigo-600",
    shadowColor: "shadow-blue-500/20",
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Fully responsive design that works beautifully on phones, tablets, and desktops.",
    color: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
  },
  {
    icon: Cpu,
    title: "No Limits",
    description: "Process files up to 100MB without restrictions. No premium tiers or hidden limits.",
    color: "from-rose-500 to-pink-600",
    shadowColor: "shadow-rose-500/20",
  },
  {
    icon: Lock,
    title: "Open Source",
    description: "Transparent, community-driven development. Trust the code you run.",
    color: "from-cyan-500 to-teal-600",
    shadowColor: "shadow-cyan-500/20",
  },
]

export function FeaturesSection() {
  return (
    <section className="w-full py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-xs font-semibold text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            WHY CHOOSE US
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
            Built for developers,
            <br />
            <span className="text-muted-foreground">loved by everyone</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            We understand what you need because we built this for ourselves first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-3xl border border-border bg-background hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-secondary/80 to-muted/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl ${feature.shadowColor} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-red-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
