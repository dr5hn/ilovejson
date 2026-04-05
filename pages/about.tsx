import Layout from '@components/layout'
import Head from 'next/head'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <Layout>
      <Head>
        <title>About - I Love JSON | Free Online JSON Tools</title>
        <meta name="description" content="Learn about ILoveJSON — a free suite of online JSON tools for developers. Convert, format, validate, diff, merge, and query JSON with ease." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-5xl font-black mb-6">
            I<span className="text-muted-foreground">{'{'}<Heart className="w-8 h-8 text-red-500 fill-red-500 inline mx-1" />{'}'}</span>JSON
          </div>
          <h1 className="text-3xl font-bold mb-4">Every JSON tool you need, in one place.</h1>
        </div>

        <div className="space-y-6 text-muted-foreground">
          <p className="text-lg">
            I Love JSON is a free, open-source collection of tools for developers who work with JSON every day.
            Convert between formats, validate syntax, beautify output, compare files, and more.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Why we built this</h2>
          <p>
            We got tired of Googling for a different tool every time we needed to convert a JSON file to CSV,
            validate a config, or diff two API responses. So we built one place that does it all — fast,
            free, and private.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Open Source</h2>
          <p>
            I Love JSON is open source. Contributions, bug reports, and feature requests are welcome on{' '}
            <Link href="https://github.com/ilovejson/ilovejson" className="text-primary hover:underline" target="_blank">
              GitHub
            </Link>.
          </p>
        </div>
      </div>
    </Layout>
  )
}
