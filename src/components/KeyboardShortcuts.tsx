"use client"

import { useState, useEffect } from "react"
import { X, Command } from "lucide-react"

interface Shortcut {
  keys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "Enter"], description: "Process / Convert" },
  { keys: ["Ctrl", "K"], description: "Open search" },
  { keys: ["Ctrl", "C"], description: "Copy output" },
  { keys: ["Ctrl", "S"], description: "Download result" },
  { keys: ["Esc"], description: "Close dialogs / Reset" },
]

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Dialog */}
      <div className="relative bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 fade-in duration-200 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              <Command className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <span key={keyIdx}>
                    <kbd className="px-2 py-1 bg-muted rounded-lg text-xs font-mono font-semibold text-foreground">
                      {key}
                    </kbd>
                    {keyIdx < shortcut.keys.length - 1 && <span className="text-muted-foreground mx-1">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift + ?</kbd> to toggle this
          dialog
        </p>
      </div>
    </div>
  )
}

export default KeyboardShortcutsDialog
