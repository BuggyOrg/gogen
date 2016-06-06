
import * as handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import * as types from './types.js'
import {sanitize} from './utils.js'
import _ from 'lodash'

handlebars.registerHelper('sanitize', sanitize)

handlebars.registerHelper('ifEq', (s1, s2, opts) => {
  if (s1 === s2) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('arrayType', (type) => {
  // improve replacement, use typify for that!?
  return types.arrayType(type)
})

handlebars.registerHelper('normType', (type) => {
  return types.normalize(type)
})

handlebars.registerHelper('lambda', (type) => {
  return types.createLambdaFunctions(type)
})

handlebars.registerHelper('noContinuation', (continuations, type, opts) => {
  if (!_.find(continuations, (c) => c.port === type)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('partial', (partial, port) => {
  var inFn = partial.rawInputPorts.fn
  var inArgs = _.intersection(inFn.argumentOrdering, _.keys(inFn.arguments))
  var inOuts = _.intersection(inFn.argumentOrdering, _.keys(inFn.outputs))
  var callArgs = _.concat(inArgs, inOuts)
  callArgs[partial.params.partial] = port
  var callStr = callArgs.join(', ')
  var res = partial.rawOutputPorts.result
  var resArgs = _.intersection(res.argumentOrdering, _.keys(res.arguments))
  var resOuts = _.intersection(res.argumentOrdering, _.keys(res.outputs))
  var funcStr = _.concat(
    _.map(resArgs, (name) => sanitize(name) + ' chan ' + types.normalize(res.arguments[name])),
    _.map(resOuts, (name) => sanitize(name) + ' chan ' + types.normalize(res.outputs[name]))).join(', ')
  return 'func (' + funcStr + ') { fn(' + callStr + ') }'
})

handlebars.registerHelper('hasOutputParams', (partial, opts) => {
  if (_.keys(partial.rawOutputPorts.result.arguments).length > 0) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

var processTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/process.hb'), 'utf8'), {noEscape: true})
var specialFormTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/special_form.hb'), 'utf8'), {noEscape: true})
var compoundTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/compound.hb'), 'utf8'), {noEscape: true})
var unpackedTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/unpack.hb'), 'utf8'), {noEscape: true})
var sourceTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/source.hb'), 'utf8'), {noEscape: true})

/**
 * Create the source for a process
 * @process Expects a process format of {name: String, inputPorts: Array[{name: String, type: String}], outputPorts: Array[{name: String, type: String}], code: String}
 */
export function createProcess (proc) {
  if (proc.specialForm) {
    proc.compiledCode = handlebars.compile(proc.code, {noEscape: true})(proc)
    return specialFormTemplate(proc)
  } else {
    proc.compiledCode = handlebars.compile(proc.code, {noEscape: true})(_.merge({},
      proc.params,
      {
        ports: _.merge({}, proc.inputPorts, proc.outputPorts),
        settings: proc.settings
      }))
    return processTemplate(proc)
  }
}

function portName (portNode) {
  return _.last(portNode.split('_'))
}

/**
 * Create the source for a coumpound node
 * @compound Expects a compound node with the following structure
 * {
 *   name: String,
 *   inputPorts: Array[{name: String, type: String}],
 *   outputPorts: Array[{name: String, type: String}],
 *   prefixes: Array[String],
 *   channels: Array[{?, type: String}],
 *   processes: Array[{name: String, inputs: Array[{name: String, type: String}], outputs: Array[{name: String, type: String}], additionalParameters: Array[String]}]
 * }
 */
export function createCompound (cmpd) {
  if (cmpd.settings && cmpd.settings.unpacked) {
    var arrayInputs = _.pickBy(cmpd.inputPorts, types.isArrayType)
    var normalInputs = _.pickBy(cmpd.inputPorts, _.negate(types.isArrayType))
    var unpackChannels = _.filter(cmpd.channels, (c) => _.has(arrayInputs, portName(c.inPort)))
    var cacheChannels = _.filter(cmpd.channels, (c) => _.has(normalInputs, portName(c.inPort)))
    var arrayOutputs = _.pickBy(cmpd.outputPorts, types.isArrayType)
    var packChannels = _.filter(cmpd.channels, (c) => _.has(arrayOutputs, portName(c.outPort)))
    console.log(cmpd.channels)
    console.log(unpackChannels)
    return unpackedTemplate(_.merge({}, cmpd, {
      unpacks: unpackChannels,
      caches: cacheChannels,
      packs: packChannels,
      channels: _.map(cmpd.channels, (c) =>
        (_.find(unpackChannels, (u) =>
          (u.outPort === c.outPort)))
            ? _.merge({}, c, {unpacked: true})
            : c)
    }))
  } else {
    return compoundTemplate(cmpd)
  }
}

export { sourceTemplate as createSource }
