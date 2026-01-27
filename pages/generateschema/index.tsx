import { UtilityPage } from '@components/UtilityPage'
import { FileCode } from 'lucide-react'
import GenerateSchema from 'generate-schema'

const generateSchema = (input: string): string => {
  const parsed = JSON.parse(input)
  const schema = GenerateSchema.json('Generated', parsed)
  return JSON.stringify(schema, null, 2)
}

const GenerateSchemaPage = () => {
  return (
    <UtilityPage
      title="Generate JSON Schema"
      description="Generate a JSON Schema from your JSON data"
      processLabel="Generate Schema"
      processFn={generateSchema}
      color="#a855f7"
      icon={<FileCode className="w-5 h-5" />}
    />
  )
}

export default GenerateSchemaPage
