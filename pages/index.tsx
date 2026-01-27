import Layout from '@components/layout'
import { HeroSection } from '@components/HeroSection'
import { ToolsGrid } from '@components/ToolsGrid'
import { FeaturesSection } from '@components/FeaturesSection'
import { CTASection } from '@components/CTASection'

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <ToolsGrid />
      <FeaturesSection />
      <CTASection />
    </Layout>
  )
}
