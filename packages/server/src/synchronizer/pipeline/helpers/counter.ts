import {through} from '../../streams'

export default function countItems() {
  const counter = {count: 0}
  const stream = through({objectMode: true}, (file, _, next) => {
    counter.count++
    next(null, file)
  })
  return {stream, counter}
}
