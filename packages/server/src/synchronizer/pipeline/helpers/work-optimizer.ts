// Mostly concerned with solving the Dirty Sync problem

import {through} from '../../streams'

import File from 'vinyl'

export default () => {
  const todo: Array<string> = []
  const done: Array<string> = []

  const stats = {todo, done}

  const reportComplete = through({objectMode: true}, (file: File, _, next) => {
    done.push(file.hash)
    // console.log(`${done.length} files processed.`)
    next(null, file)
  })

  const triage = through({objectMode: true}, function (file: File, _, next) {
    // Dont send files
    if (done.includes(file.hash) || todo.includes(file.hash)) {
      console.log('Rejecting because this job has been done before: ' + file.path)
      return next()
    }

    todo.push(file.hash)

    this.push(file)

    next()
  })

  return {triage, reportComplete, stats}
}
