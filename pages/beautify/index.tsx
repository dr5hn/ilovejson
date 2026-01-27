import { UtilityPage } from '@components/UtilityPage'
import { Sparkles } from 'lucide-react'

const beautifyJSON = (input: string): string => {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed, null, 2)
}

const Beautify = () => {
  return (
    <UtilityPage
      title="Beautify JSON"
      description="Format and indent your JSON for better readability"
      processLabel="Beautify JSON"
      processFn={beautifyJSON}
      color="#f59e0b"
      icon={<Sparkles className="w-5 h-5" />}
    />
  )
}

export default Beautify
