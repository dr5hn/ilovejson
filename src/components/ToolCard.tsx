import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface ToolCardProps {
  title: string
  description: string
  icon1: string
  icon2: string
  color1: string
  color2: string
  href?: string
  highlighted?: boolean
  isNew?: boolean
}

export function ToolCard({
  title,
  description,
  icon1,
  icon2,
  color1,
  color2,
  href = "#",
  highlighted = false,
  isNew = false,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col h-full p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/[0.08] ${
        highlighted
          ? "border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
          : "border-border bg-card hover:border-red-200 dark:hover:border-red-900/50"
      }`}
    >
      {isNew && (
        <span className="absolute -top-2.5 -right-2.5 px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30 animate-pulse">
          NEW
        </span>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl"
          style={{ backgroundColor: color1, boxShadow: `0 8px 24px -4px ${color1}40` }}
        >
          {icon1}
        </div>
        <div className="flex items-center justify-center w-6">
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300" />
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-xl"
          style={{ backgroundColor: color2, boxShadow: `0 8px 24px -4px ${color2}40` }}
        >
          {icon2}
        </div>
      </div>

      <h3
        className={`font-bold text-base mb-2 transition-colors duration-200 ${
          highlighted ? "text-red-600 dark:text-red-400" : "text-foreground group-hover:text-red-500"
        }`}
      >
        {title}
      </h3>

      <p
        className={`text-sm leading-relaxed line-clamp-2 flex-grow ${
          highlighted ? "text-red-500/70 dark:text-red-400/70" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <span>Convert now</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  )
}

export default ToolCard
