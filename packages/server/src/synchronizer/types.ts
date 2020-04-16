import File from 'vinyl'
import {Manifest} from './pipeline/rules/manifest'
import {through} from './streams'

// Rule functions transform the file stream
// If the function returns an array of files add those files to the stream
// If you return an empty array the input file will be deleted from the stream
// export type Rule = (file: File, encoding?: string) => File | File[]

// export type RuleConfig = {

// }

export type PhaseNames = keyof RuleTransformObject

type RuleTransformObject = {
  input: ReturnType<typeof through>
  analyze: ReturnType<typeof through>
  process: ReturnType<typeof through>
  write: ReturnType<typeof through>
  complete: ReturnType<typeof through>
}

export type ReadyObj = {
  manifest: Manifest
}

export type ReadyFn = (obj: ReadyObj) => void
export type ReadyArg = ReadyObj | ReadyFn
export type Rule = (a: {
  config: RuleConfig
  addFile: (file: File) => void
  ready: ReadyArg
  taps: () => RuleTransformObject
}) => Partial<RuleTransformObject>

export type RuleInitializer = any

export type RuleConfig = {
  src: string
  dest: string
  cwd: string
  manifest: {
    path: string
    write: boolean
  }
}
