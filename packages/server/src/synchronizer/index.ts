import {Manifest} from './pipeline/rules/manifest'
import {pipe} from './streams'
import createPipeline from './pipeline'
import agnosticSource from './pipeline/helpers/agnostic-source'
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
  watch,
  includePaths: include,
  ignoredPaths: ignore,
  writeManifestFile,
}: SynchronizeFilesInput): Promise<SynchronizeFilesOutput> {
  // HACK: This should be removed to enable optimized code copying
  await clean(dest)

  // checkNestedApi(entries)
  // checkDuplicateRoutes(entries)

  // Clean folder
  return new Promise((resolve, reject) => {
    const config = {
      cwd: src,
      src: src,
      dest: dest,
      manifest: {
        path: manifestPath,
        write: writeManifestFile,
      },
    }

    const readyHandler = () => {
      resolve({manifest: pipeline.manifest})
    }

    const catchErrors = (err: any) => {
      if (err) reject(err)
    }

    const source = agnosticSource({cwd: src, include, ignore, watch})
    const pipeline = createPipeline(config, readyHandler)

    pipe(source.stream, pipeline.stream, catchErrors)
  })
}

async function clean(path: string) {
  if (await pathExists(path)) {
    await remove(path)
  }
  return await ensureDir(path)
}
