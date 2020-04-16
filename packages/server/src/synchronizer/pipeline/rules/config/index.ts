import {pathExistsSync} from 'fs-extra'
import {resolve} from 'path'
import File from 'vinyl'

import {through} from '../../../streams'
import {RuleConfig} from '../../../types'
import {Transform} from 'stream'

// const isBlitzConfigPath = (p: string) => /blitz\.config\.(js|ts)/.test(p)

export default function create(config: RuleConfig, input: Transform, _errors: Transform) {
  // Preconditions
  const hasNextConfig = pathExistsSync(resolve(config.src, 'next.config.js'))
  const hasBlitzConfig = pathExistsSync(resolve(config.src, 'blitz.config.js'))

  if (hasNextConfig) {
    // TODO: Pause the stream and ask the user if they wish to have their configuration file renamed
    const err = new Error(
      'Blitz does not support next.config.js. Please rename your next.config.js to blitz.config.js',
    )
    err.name = 'NextConfigSupportError'
    throw err
  }

  if (!hasBlitzConfig) {
    // Assume a bare blitz config
    input.write(
      new File({
        path: resolve(config.src, 'blitz.config.js'),
        contents: Buffer.from('module.exports = {};'),
      }),
    )
  }

  const nextConfigShellTpl = `
const {withBlitz} = require('@blitzjs/server');
const config = require('./blitz.config.js');
module.exports = withBlitz(config);
`

  input.write(
    new File({
      path: resolve(config.src, 'next.config.js'),
      contents: Buffer.from(nextConfigShellTpl),
    }),
  )

  const stream = through({objectMode: true}, async (file: File, _, next) => {
    return next(null, file)
  })

  return {stream}
}
