import {Manifest} from './pipeline/rules/manifest'
import {pipe} from './streams'
import {initialize} from './pipeline'
import agnosticInput from './pipeline/helpers/agnostic-input'
import countItems from './pipeline/helpers/counter'
import {pathExists, ensureDir, remove} from 'fs-extra'

type SynchronizeFilesInput = {
  src: string
  dest: string
  watch: boolean
  manifestPath: string
  ignoredPaths: string[]
  includePaths: string[]
  writeManifestFile: boolean
}

type SynchronizeFilesOutput = {
  manifest: Manifest
}

export async function synchronizeFiles({
  dest,
  src,
  manifestPath,
  includePaths: include,
  ignoredPaths: ignore,
  writeManifestFile,
}: SynchronizeFilesInput): Promise<SynchronizeFilesOutput> {
  await clean(dest)
  return new Promise((resolve, reject) => {
    const counter = countItems()
    const source = agnosticInput({cwd: src, include, ignore})

    const config = {
      cwd: src,
      src: src,
      dest: dest,
      manifest: {
        path: manifestPath,
        write: writeManifestFile,
      },
    }

    const pipeline = initialize(config, () => {
      resolve({manifest: pipeline.manifest})
    })

    pipe(source.stream, counter.stream, pipeline.stream, (err: any) => {
      if (err) reject(err)
    })
  })
}

async function clean(path: string) {
  if (await pathExists(path)) {
    await remove(path)
  }
  return await ensureDir(path)
}
