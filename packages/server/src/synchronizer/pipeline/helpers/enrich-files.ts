import {through} from '../../streams'
import crypto from 'crypto'

export default () => {
  const stream = through({objectMode: true}, (file, _, next) => {
    // Don't send directories
    if (file.isDirectory()) {
      return next()
    }

    if (!file.event) {
      file.event = 'add'
    }

    if (!file.hash) {
      const hash = crypto
        .createHash('md5')
        .update(JSON.stringify({path: file.path, s: file.stats?.mtimeMs}))
        .digest('hex')

      file.hash = hash
    }

    next(null, file)
  })
  return {stream}
}
