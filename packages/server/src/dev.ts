import {resolve} from 'path'
import {synchronizeFiles} from './synchronizer'
import {ServerConfig, enhance} from './config'
import {nextStartDev} from './next-utils'
import chalk from 'chalk'

export async function dev(config: ServerConfig) {
  const {
    rootFolder,
    nextBin,
    devFolder,
    ignoredPaths,
    manifestPath,
    writeManifestFile,
    includePaths,
    watch = true,
  } = await enhance({
    ...config,
    interceptNextErrors: true,
  })
  const src = resolve(rootFolder)
  const dest = resolve(rootFolder, devFolder)

  try {
    const {manifest} = await synchronizeFiles({
      src,
      dest,
      watch,
      ignoredPaths,
      includePaths,
      manifestPath,
      writeManifestFile,
    })
    nextStartDev(nextBin, dest, manifest, devFolder)
  } catch (err) {
    console.log(chalk.red(err.message))
    return
  }
}
