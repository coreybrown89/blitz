import {through, pipeline} from '../../../streams'
import gulpIf from 'gulp-if'
import {unlink} from '../../helpers/unlink'
import {dest} from 'vinyl-fs'
import File from 'vinyl'
import {Rule} from '../../../types'

// import chalk from 'chalk'
const create: Rule = ({config}) => {
  let count = 0
  const reporter = through((data, _, next) => {
    next(null, `writing[${count++}]: ${data.toString().replace(config.cwd, '')}\n`)
  })

  const stream = pipeline(
    through({objectMode: true}, (file: File, _, next) => {
      // drop folders
      if (file.isDirectory()) return next()
      next(null, file)
    }),
    gulpIf(isUnlinkFile, unlink(config.dest), dest(config.dest)),
    through({objectMode: true}, (file: File, _, next) => {
      reporter.write(file.history[0])
      next(null, file)
    }),
  )

  return {stream, reporter}
}

export default create

const isUnlinkFile = (file: File) => file.event === 'unlink' || file.event === 'unlinkDir'
