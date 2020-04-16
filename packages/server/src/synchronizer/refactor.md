# Plugin interface

Design goals

- Rules: Related logic needs to live together
- Everything is a rule
- Efficiency
- Paralell processing
- Dirty restart
- Functional style

# Node stream based

https://www.freecodecamp.org/news/rxjs-and-node-8f4e0acebc7c/
Need to use streams for speed paralellisation and to keep memory footprint low also allows us to utilise gulp api to manage stream logic.

Helper Libs

- Pipe - [pump](https://npmjs.com/package/pump)
- Pipeline - [pumpify](https://npmjs.com/package/pumpify)
- Through - [through2](https://npmjs.com/package/through2)
- Concat - [concat-stream](https://npmjs.com/package/concat-stream)
- Parallel - [parallel-transform](https://npmjs.com/package/parallel-transform)
- Node Compat - [readable-stream](https://npmjs.com/package/readable-stream)

# Phases

Each phase has access to various list reductions

```ts
type Reductions = {
  inputted: () => Inputted
  processed: () => Processed
  written: () => Written
  completed: () => Completed
}
```

All phases can be run internally in paralell.

| Phase    | Data type                                                     | Process Description                                                                     |
| -------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| _Input_  | `RawFile -> File` setInputted()                               | (Internal) Hash files. Guard against double processing. Single Stream leads to Analysis |
| Process  | `{ File, getInputtedList, getProcessedList, getWrittenList }` | Alter files and file paths and add new related files back to Input                      |
| Write    | `{ File, getInputtedList, getProcessedList, getWrittenList }` | Write files to disk.                                                                    |
| Complete | `{File, InputList, CompletionList}` setCompleted()            | Process output. Report on 'ready'                                                       |

Rules will be of the format:

```ts
type Rule = (a: {
  config: Config
  addFile: (file: File) => void
  ready: ReadyObj | (obj: ReadyObj) => void
  taps: () => {
    analyze: Transform
    process: Transform
    write: Transform
    complete: Transform
  }
}) => {
  analyze?: Transform
  process?: Transform
  write?: Transform
  complete?: Transform
}
```

# Evented Vinyl Files

Evented Vinyl Files are vinyl files with events attached to them

```ts
const isDelete = file => file.isNull() && file.event === 'unlink'

// The input file at '/path/to/foo' was deleted
// This can be transformed during the process phase
return new Vinyl({
  path: '/path/to/foo',
  content: null,
  event: 'unlink',
})
```

```ts
// Add file at '/path/to/foo'
new Vinyl({
  path: '/path/to/foo',
  content: someContentStream,
})
```

# Input agnostic

Pipeline should be input agnostic ie. it should not matter if it comes from watch or a folder glob

# Input

Input manages inputting of evented vinyl file.
Files that have already been processed or are currently being processed should not be processed again.
Manage a running list of input table indexed by hash

# Analysis

Some types of analysis needs a list of all the files other types do not

Analysis needs to be done in stream as new information comes in. Eg. when someone renames a file that file goes to the analysis engine which works out invariants as they occur without requiring a sweep of the entire file system.

To do this it should work in stream and have access to a list of the ingress and complete items

# Process

Process should take a file and process it

Possible things it can do:

- Change its path or contents
- Drop the file from further processing. Don't copy it.
- Add new files to the input stream - Associating the new files with the original

# Rules

Rules can create a new file to add to the head of the queue

They can fork a stream eg. to run a paralell process such as analysis or write a manifest file

They can hold state in a closure.

They should be managed in a list.

The entire chain can be a list of streams.

```ts
// index.ts
import {pipe} from './stream'

const config = {
  watching: true,
  src: '/path/to/src',
  dest: '/path/to/dest',
  ignore: 'dest',
}

const initialize = composeRules(blitzConfig, rpc, pages, manifest, fileWriting)

// returns watch and glob input data as vinyl objects in a single stream
const source = gatherInput(config)

return new Promise((resolve, reject) => {
  const readyHandler = resolveData => resolve(resolveData)

  // Run initialization code for all streams
  const rules = await initialize(config, readyHandler)

  pipe(source, rules, () => {
    if (err) reject(err)
  })
})
```

```ts
import {pipeline} from './stream';

function composeRules(...initializers) {
  const rules = initializers.reduce(...);
  return function initialize(config: Config, readyHandler: CallbackFn) {
    return pipeline(
      input,
      rules,
      complete(readyHandler)
    );
  }
}
```

```ts
import {pipeline} from './streams'

export default ({input, ready}: Api): Transform => {
  const manifest = Manifest.create()

  input(file)

  ready(obj => ({...obj, manifest})) // can use a merge function
  ready({manifest}) // shallow merge to ready object

  // Every key is a stream that will be piped to in order to become
  // the new phase stream.
  // Eg. write = pipeline(write, retObj.write)
  return {
    input,
    analyze
    process,
    write,
    complete
  }
}
```

```ts
// Manifest rule
export default ({ready}) => {
  const manifest = Manifest.create()

  ready({manifest})

  const complete = pipeline(
    setManifestEntry(manifest),
    createManifestFile(manifest, manifestPath),
    debounce(300, gulpIf(writeManifestFile, dest(srcPath))),
  )

  return {complete}
}
```

```ts
// File writer
export default () => {
  return {
    write: gulpIf(isUnlinkFile, unlink(destPath), dest(destPath)),
  }
}
```

# Dirty Sync

- Encode vinyl files + stats

```ts
const hash = crypto
  .createHash('md5')
  .update(file.path + file.stats.mtime)
  .digest('hex')

file.hash = hash
```

- Use those hashes to index file details in the following structures:

```ts
// reduced to as the first step during input
const input = {abc123def456: '/foo/bar/baz', def456abc123: '/foo/bar/bop'}

// reduced to as the last step just before file write
const complete = {
  abc123def456: {
    input: '/foo/bar/baz',
    output: ['/bas/boop/blop', '/bas/boop/ding', '/bas/boop/bar'],
  },
  def456abc123: {
    input: '/foo/bar/bing',
    output: ['/bas/boop/ping', '/bas/boop/foo', '/bas/boop/fawn'],
  },
  cbd123aef456: {
    input: '/foo/bar/bop',
    output: ['/bas/boop/thing'],
  },
}
```

Has this file hash been processed?

```ts
const hash => !output[hash];
```

Which files do I still need to delete?

```ts
const deleteHashes = Object.keys(output).filter(hash => input[hash])
```

- Output can also be indexed by filetype to keep going with our hacky error mapping (eventually this should probably be a sourcemap)

```json
{
  "/bas/boop/bar": "/foo/bar/baz",
  "/bas/boop/blop": "/foo/bar/baz",
  "/bas/boop/ding": "/foo/bar/baz",
  "/bas/boop/fawn": "/foo/bar/bing",
  "/bas/boop/foo": "/foo/bar/bing",
  "/bas/boop/ping": "/foo/bar/bing",
  "/bas/boop/thing": "/foo/bar/bop"
}
```

Does my output match my input ie. am I in a stable state? or in our case can we return the promise.

```ts
function isStable(input, output) {
  if (!input || !output) {
    return // We are not stable if we don't have both an input or output
  }

  const inputKeys = Object.keys(input)
  const outputKeys = Object.keys(output)

  if (inputKeys.length !== outputKeys.length) {
    return false
  }
  match = true
  for (let i = 0; i < inputKeys.length; i++) {
    match = match && outputKey[i] === inputKeys[i]
    if (!match) {
      return false
    }
  }
  return true
}
```
