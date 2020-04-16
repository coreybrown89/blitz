import {through} from '../../streams'

export default (handler: Function) => {
  let timeout: number

  // Ready is used to close the promise and will run when
  // The input stream does not have input for a set time
  // This happens during watch mode
  function resetTimeout() {
    destroyTimeout()
    timeout = setTimeout(handler, 2000)
  }

  function destroyTimeout() {
    clearTimeout(timeout)
  }

  const stream = through({objectMode: true}, function (f, _, next) {
    resetTimeout()
    next(null, f)
  })

  stream.on('end', () => {
    destroyTimeout()
    handler()
  })

  return {stream}
}
