import {pipeline, through} from '../streams'
import {RuleConfig} from '../types'
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

type CallbackFn = () => void

const input = through({objectMode: true}, (f, _, next) => {
  next(null, f)
})
const errors = through({objectMode: true}, (f, _, next) => next(null, f))

export default function createPipeline(config: RuleConfig, readyHandler: CallbackFn) {
  // Helper streams don't account for business rules
  const _workOptimizer = createWorkOptimizer()
  const _enrichFiles = createFileEnricher()
  const _srcCache = createFileCache(isSourceFile)
  const _writeCounter = createCounter()
  const _readyHandler = createReadyHandler(() => {
    readyHandler()
  })

  // Rules represent business rules
  const rulePages = createRulePages(config)
  const ruleRpc = createRuleRpc(config)
  const ruleConfig = createRuleConfig(config, input, errors)
  const ruleWrite = createRuleWrite(config)
  const ruleManifest = createRuleManifest(config)

  //ruleWrite.reporter.pipe(process.stdout)

  const stream = pipeline(
    // List
    input,

    _enrichFiles.stream,
    _srcCache.stream,
    _workOptimizer.triage,

    rulePages.stream,
    ruleRpc.stream,
    ruleConfig.stream,
    ruleWrite.stream,

    _writeCounter.stream,
    _workOptimizer.reportComplete,

    ruleManifest.stream,

    _readyHandler.stream,
  )

  errors.on('data', (data) => {
    console.log(data.toString())
  })

  return {stream, manifest: ruleManifest.manifest}
}
