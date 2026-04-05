import { UtilityPage } from '@components/UtilityPage'
import { Shrink } from "lucide-react"

function minifyJson(input) {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed)
}

export default function MinifyPage() {
  return (
    <UtilityPage
      title="Minify JSON"
      description="Strip all whitespace from JSON for production use."
      processLabel="Minify JSON"
      processFn={minifyJson}
      color="#8b5cf6"
      icon={<Shrink className="w-5 h-5" />}
    />
  )
}
