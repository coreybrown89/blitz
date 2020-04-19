import {pipeline, through} from '../../streams'
import vfs from 'vinyl-fs'

type SourceConfig = {cwd: string; include: string[]; ignore: string[]}

export default function agnosticInput({ignore, include, cwd}: SourceConfig) {
  const stream = through({objectMode: true}, (file, _, next) => {
    next(null, file)
  })

  pipeline(
    vfs.src([...include, ...ignore.map((a) => '!' + a)], {
      buffer: true,
      read: true,
      cwd,
      stat: true,
    }),
  )

  return {stream}
}
