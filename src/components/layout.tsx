import { Header } from '@components/Header'
import { Footer } from '@components/Footer'
import { KeyboardShortcutsDialog } from '@components/KeyboardShortcuts'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

const Layout = ({ children, title, description }: LayoutProps) => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <Header />

    <main className="flex-grow">
      {(title || description) && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4">
          {title && (
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </main>

    <Footer />
    <KeyboardShortcutsDialog />
  </div>
)

export default Layout
