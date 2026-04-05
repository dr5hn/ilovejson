"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  return {
    theme: theme as "light" | "dark" | "system" | undefined,
    setTheme,
    resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
  }
}
