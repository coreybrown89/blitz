import {through} from '../../../streams'
import File from 'vinyl'
import {absolutePathTransform} from '../utils'
import {RuleConfig} from '../../../types'

export default (config: RuleConfig) => {
  const {src} = config
  const transformer = absolutePathTransform(src)(pathTransformer)
  const stream = through.obj((file: File, _, next) => {
    file.path = transformer(file.path)
    next(null, file)
  })

  return {stream}
}

export function pathTransformer(path: string) {
  const regex = new RegExp(`(?:\\/?app\\/.*?\\/?)(pages\\/.+)$`)
  return (regex.exec(path) || [])[1] || path
}
