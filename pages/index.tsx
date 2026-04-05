import Head from 'next/head'
import Layout from '@components/layout'
import { HeroSection } from '@components/HeroSection'
import { ToolsGrid } from '@components/ToolsGrid'
import { FeaturesSection } from '@components/FeaturesSection'
import { CTASection } from '@components/CTASection'

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>ILoveJSON | Free Online JSON Tools for Developers</title>
        <meta name="description" content="30+ free online JSON tools — convert JSON to CSV, YAML, XML, SQL, TypeScript, and more. Validate, format, diff, merge, and query JSON instantly. No signup required." />
      </Head>
      <HeroSection />
      <ToolsGrid />
      <FeaturesSection />
      <CTASection />
    </Layout>
  )
}
