import { UtilityPage } from '@components/UtilityPage'
import { CheckCircle } from 'lucide-react'

const validateJSON = (input: string): string => {
  try {
    const parsed = JSON.parse(input)
    return `Valid JSON!\n\nStructure:\n- Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}\n- Keys: ${typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 'N/A'}\n- Size: ${input.length} characters`
  } catch (e: any) {
    throw new Error(`Invalid JSON: ${e.message}`)
  }
}

const Validate = () => {
  return (
    <UtilityPage
      title="Validate JSON"
      description="Check if your JSON is valid and well-formed"
      processLabel="Validate JSON"
      processFn={validateJSON}
      color="#22c55e"
      icon={<CheckCircle className="w-5 h-5" />}
    />
  )
}

export default Validate
