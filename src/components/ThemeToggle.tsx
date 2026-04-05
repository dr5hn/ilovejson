"use client"

import { useTheme } from "@components/ThemeProvider"
import { Sun, Moon, Monitor } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const themes = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl p-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value)
                setIsOpen(false)
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === t.value
                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeToggle
