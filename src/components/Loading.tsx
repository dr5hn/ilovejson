import { Heart } from "lucide-react"

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={`${sizes[size]} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none" className="text-red-500">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/30 animate-pulse">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -inset-4 rounded-full border-4 border-red-200 border-t-red-500 animate-spin" />
      </div>
      <p className="mt-8 text-muted-foreground font-medium animate-pulse">Loading...</p>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-card rounded-3xl border border-border p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded-lg w-3/4" />
          <div className="h-3 bg-muted rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded-lg" />
        <div className="h-3 bg-muted rounded-lg w-5/6" />
      </div>
    </div>
  )
}

export function LoadingToolsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}

export default LoadingSpinner
