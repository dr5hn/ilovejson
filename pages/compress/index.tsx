import { UtilityPage } from '@components/UtilityPage'
import { Minimize2 } from 'lucide-react'

const compressJSON = (input: string): string => {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed)
}

const Compress = () => {
  return (
    <UtilityPage
      title="Compress JSON"
      description="Minify your JSON by removing whitespace and formatting"
      processLabel="Compress JSON"
      processFn={compressJSON}
      color="#8b5cf6"
      icon={<Minimize2 className="w-5 h-5" />}
    />
  )
}

export default Compress
