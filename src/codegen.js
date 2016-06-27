
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

var typePrefix = 'chan '

handlebars.registerHelper('arrayType', (type) => {
  // improve replacement, use typify for that!?
  return types.arrayType(type)
})

handlebars.registerHelper('normType', (type) => {
  if (typeof (type) === 'undefined') { return '~undefined-type~' }
  return types.normalize(type, typePrefix)
})

handlebars.registerHelper('lambda', (type) => {
  return types.createLambdaFunctions(type, typePrefix)
})

const findPort = (uid, ports, port) => {
  var keys = _.map(ports, (t, name) => `${uid}_PORT_${name}`)
  return _.includes(keys, port)
}

const hasPort = (node, port) =>
  findPort(node.uid, node.inputPorts, port) || findPort(node.uid, node.outputPorts, port)

handlebars.registerHelper('hasPort', (node, port, opts) => {
  if (hasPort(node, port)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('log', (value) => {
  console.error(JSON.stringify(value))
})

handlebars.registerHelper('cmpdChannel', (node, port1, port2, opts) => {
  if (hasPort(node, port1) || hasPort(node, port2)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('necessaryForContinuation', (port, node, opts) => {
  if ((node.params && node.params.isContinuation === true) ||
    (node.params && node.params.isContinuation && node.params.isContinuation.type === 'recursion') ||
    (node.params && node.params.isContinuation && _.find(node.params.isContinuation.branchPorts, port))) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('noContinuation', (continuations, type, opts) => {
  if (!_.find(continuations, (c) => c.port === type)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

const setupChannels = (handlebars) => {
  typePrefix = 'chan '
  handlebars.unregisterHelper('chanValue')
  handlebars.unregisterHelper('chanName')
  handlebars.unregisterHelper('putValue')
  handlebars.unregisterHelper('createChan')
  handlebars.unregisterHelper('closeChan')
  handlebars.unregisterHelper('checkOk')
  handlebars.registerHelper('chanValue', (varName, okName, channelName) => {
    return `${varName}, ${okName} := <- ${channelName}_chan`
  })
  handlebars.registerHelper('chanName', (channelName) => {
    return `${channelName}_chan`
  })
  handlebars.registerHelper('putChan', (channelName, value) => {
    return `${channelName}_chan <- ${value}`
  })
  handlebars.registerHelper('createChan', (channelName, type) => {
    return `${channelName}_chan := make(chan ${type})`
  })
  handlebars.registerHelper('closeChan', (channelName) => {
    return `close(${channelName}_chan)`
  })
  handlebars.registerHelper('checkOk', (okName) => {
    return `if !${okName} {
      break
    }`
  })
}

const setupSeq = (handlebars) => {
  typePrefix = '*'
  handlebars.unregisterHelper('chanValue')
  handlebars.unregisterHelper('chanName')
  handlebars.unregisterHelper('putValue')
  handlebars.unregisterHelper('createChan')
  handlebars.unregisterHelper('closeChan')
  handlebars.unregisterHelper('checkOk')
  handlebars.registerHelper('chanValue', (varName, okName, channelName) => {
    if (varName === channelName) { return `` }
    return `${varName} := ${channelName}`
  })
  handlebars.registerHelper('chanName', (channelName) => {
    return `${channelName}`
  })
  handlebars.registerHelper('putChan', (channelName, value) => {
    if (value.indexOf('func') !== -1) { return `${channelName} = ${value}` }
    return `${channelName} = &${value}`
  })
  handlebars.registerHelper('createChan', (channelName, type) => {
    return `var ${channelName}_tmp ${type}
    ${channelName} := &${channelName}_tmp`
  })
  handlebars.registerHelper('closeChan', (channelName) => {
    return ``
  })
  handlebars.registerHelper('checkOk', (okName) => {
    return ``
  })
}

const isPacked = (port, node) => {
  return node.params && node.params.packedContinuations && node.params.packedContinuations[port]
}

handlebars.registerHelper('isNotPacked', (port, node, opts) => {
  if (!isPacked(port, node)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('isPacked', (port, node, opts) => {
  if (!isPacked(port, node)) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

handlebars.registerHelper('isPackedMux', (port, node, opts) => {
  if (isPacked(port, node)) {
    var cont = node.params.packedContinuations[port]
    var functionCall = 'P_' + sanitize(cont.node) + '(' + _.map(cont.value.settings.argumentOrdering, (a) => '&' + sanitize(a)).join(', ') + ')'
    return opts.fn({call: functionCall, node: cont.value, name: cont.node})
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
    _.map(resArgs, (name) => sanitize(name) + ' ' + typePrefix + types.normalize(res.arguments[name], typePrefix)),
    _.map(resOuts, (name) => sanitize(name) + ' ' + typePrefix + types.normalize(res.outputs[name], typePrefix))).join(', ')
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
var recursiveTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/compound_recursive.hb'), 'utf8'), {noEscape: true})
var unpackedTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/unpack.hb'), 'utf8'), {noEscape: true})
var sourceTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/source.hb'), 'utf8'), {noEscape: true})
var seqSourceTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/seq_source.hb'), 'utf8'), {noEscape: true})
var seqCompoundTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../src/templates/seq_compound.hb'), 'utf8'), {noEscape: true})

/**
 * Create the source for a process
 * @process Expects a process format of {name: String, inputPorts: Array[{name: String, type: String}], outputPorts: Array[{name: String, type: String}], code: String}
 */
export function createProcess (proc) {
  setupChannels(handlebars)
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
  setupChannels(handlebars)
  if (cmpd.settings && cmpd.settings.unpacked) {
    var arrayInputs = _.pickBy(cmpd.inputPorts, types.isArrayType)
    var normalInputs = _.pickBy(cmpd.inputPorts, _.negate(types.isArrayType))
    var unpackChannels = _.filter(cmpd.channels, (c) => _.has(arrayInputs, portName(c.inPort)))
    var cacheChannels = _.filter(cmpd.channels, (c) => _.has(normalInputs, portName(c.inPort)))
    var arrayOutputs = _.pickBy(cmpd.outputPorts, types.isArrayType)
    var packChannels = _.filter(cmpd.channels, (c) => _.has(arrayOutputs, portName(c.outPort)))
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
  } else if (!((cmpd.params && cmpd.params.recursiveRoot) || cmpd.recursive)) {
    return compoundTemplate(cmpd)
  } else {
    return recursiveTemplate(cmpd)
  }
}

export { sourceTemplate as createSource }

export function createSeqCompound (cmpd) {
  setupSeq(handlebars)
  cmpd.processes = _.sortBy(cmpd.processes, p => p.topSort)
  for (let proc of cmpd.processes) {
    if (!proc.atomic) {
      for (let arg of proc.arguments) {
        arg.inputPrefix = '*'
        arg.passingPrefix = '&'
      }
    }
    if (proc.specialForm) {
      proc.compiledCode = handlebars.compile(proc.code, {noEscape: true})(_.merge({sequential: true}, proc))
    } else if (proc.code) {
      proc.compiledCode = handlebars.compile(proc.code, {noEscape: true})(_.merge({}, proc.params, {ports: _.merge({}, proc.inputPorts, proc.outputPorts)}))
    }
  }
  return seqCompoundTemplate(cmpd)
}

export { seqSourceTemplate as createSeqSource }
