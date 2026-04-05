import { GetStaticPaths, GetStaticProps } from 'next'
import { ConverterPage } from '@components/ConverterPage'
import { tools } from '@constants/tools'
import { mimeTypes, formatColors, formatLabels } from '@constants/mimetypes'
import { getToolLimits, formatSize } from '@constants/limits'

interface SlugPageProps {
  slug: string
  tool: {
    from: string
    to: string
    description: string
    slug: string
  }
  maxFileSize: number
  maxFileSizeLabel: string
}

const SlugPage = ({ slug, tool, maxFileSize, maxFileSizeLabel }: SlugPageProps) => {
  const fileType = slug?.split('-')
  const fromFormat = fileType?.[0]?.toLowerCase() || 'json'
  const toFormat = fileType?.[fileType.length - 1]?.toLowerCase() || 'json'

  const mimeType = mimeTypes[fromFormat] || mimeTypes.json

  return (
    <ConverterPage
      slug={slug}
      title={slug?.replace(/-/g, ' ').toUpperCase()}
      description={tool?.description || `Convert ${tool?.from} to ${tool?.to}`}
      fromFormat={formatLabels[fromFormat] || fromFormat.toUpperCase()}
      toFormat={formatLabels[toFormat] || toFormat.toUpperCase()}
      fromColor={formatColors[fromFormat] || '#6b7280'}
      toColor={formatColors[toFormat] || '#6b7280'}
      mimeType={mimeType}
      maxFileSize={maxFileSize}
      maxFileSizeLabel={maxFileSizeLabel}
    />
  )
}

export default SlugPage

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = tools.map((t) => t.slug)
  const paths = slugs.map((slug) => ({ params: { slug } }))
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps<SlugPageProps> = async ({ params }) => {
  const slug = params?.slug as string
  const tool = tools.find((t) => t.slug === slug) || {
    from: 'JSON',
    to: 'JSON',
    description: 'Convert files',
    slug: slug
  }
  const limits = getToolLimits(slug)
  return {
    props: {
      slug,
      tool,
      maxFileSize: limits.maxFileSize,
      maxFileSizeLabel: formatSize(limits.maxFileSize),
    }
  }
}
