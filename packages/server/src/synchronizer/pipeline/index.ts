import {pipeline, through} from '../streams'
import {RuleConfig, RuleArgs} from '../types'
import createCounter from './helpers/counter'
import createFileEnricher from './helpers/enrich-files'
import createFileCache from './helpers/file-cache'
import createReadyHandler from './helpers/ready-handler'
import createWorkOptimizer from './helpers/work-optimizer'
import createRuleConfig from './rules/config'
import createRuleManifest from './rules/manifest'
import createRulePages from './rules/pages'
import createRuleRpc from './rules/rpc'
import createRuleWrite from './rules/write'
import {isSourceFile} from './utils'

const input = through({objectMode: true}, (f, _, next) => next(null, f))
const errors = through({objectMode: true}, (f, _, next) => next(null, f))

export default function createPipeline(config: RuleConfig, readyHandler: () => void) {
  // Helper streams don't account for business rules
  const _workOptimizer = createWorkOptimizer()
  const _enrichFiles = createFileEnricher()
  const _srcCache = createFileCache(isSourceFile)
  const _writeCounter = createCounter()
  const _readyHandler = createReadyHandler(() => {
    readyHandler()
  })

  const api: RuleArgs = {
    config,
    input,
    errors,
    getInputCache: () => _srcCache.cache,
  }

  // Rules represent business rules
  const rulePages = createRulePages(api)
  const ruleRpc = createRuleRpc(api)
  const ruleConfig = createRuleConfig(api)
  const ruleWrite = createRuleWrite(api)
  const ruleManifest = createRuleManifest(api)

  //ruleWrite.reporter.pipe(process.stdout)

  const stream = pipeline(
    input,

    // Preparing files
    _enrichFiles.stream,
    _srcCache.stream,
    _workOptimizer.triage,

    // Run business rules
    rulePages.stream,
    ruleRpc.stream,
    ruleConfig.stream,
    ruleWrite.stream,

    // Tidy up
    _writeCounter.stream,
    _workOptimizer.reportComplete,

    // TODO: try and move this up to business rules section
    ruleManifest.stream,

    _readyHandler.stream,
  )

  errors.on('data', (data) => {
    console.log(data.toString())
  })

  return {stream, manifest: ruleManifest.manifest}
}
