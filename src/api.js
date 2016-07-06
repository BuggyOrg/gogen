import _ from 'lodash'
import * as codegen from './codegen'
import * as sequential from './sequential'
import graphlib from 'graphlib'
import {walk, graph as graphAPI} from '@buggyorg/graphtools'
import hash from 'object-hash'
import * as types from './types'

import libConnection from '@buggyorg/component-library'
var lib = libConnection(process.env.BUGGY_COMPONENT_LIBRARY_HOST)

var isProcess = (graph, n) => {
  return graph.node(n).nodeType === 'process'
}

var isPort = (graph, n) => {
  return graph.node(n).nodeType === 'inPort' || graph.node(n).nodeType === 'outPort'
}

var additionalParameters = (node, ignoreContinuations) => {
  var params = []
  if (node.properties && node.properties.needsWaitGroup) {
    params = _.concat(params, [{name: 'wg', type: 'sync.WaitGroup', inputPrefix: '*', passingPrefix: '&'}])
  }
  if (!ignoreContinuations && node.params && node.params.isContinuation) {
    params = _.concat(params, [{name: 'continuation_' + node.name, type: 'bool', passingPrefix: ' ', callingPostfix: '_chan'}])
  }
  if (!ignoreContinuations && node.params && node.params.continuations) {
    params = _.concat(params,
      _.map(node.params.continuations, (c) => ({name: 'continuation_' + c.node, type: 'bool', passingPrefix: ' ', callingPostfix: '_chan'})))
  }
  if (!ignoreContinuations && node.auxilliaryPorts) {
    params = _.concat(params,
      _.map(node.auxilliaryPorts, (ap) => ({name: 'continuation_' + ap.node, type: 'bool', passingPrefix: ' ', callingPostfix: '_chan'})))
  }
  return params
}

var mapPortsForNode = (n, fn) => {
  return _.merge({}, n, {value: {
    inputPorts: _.mapValues(n.value.inputPorts, fn),
    outputPorts: _.mapValues(n.value.outputPorts, fn),
    rawInputPorts: n.value.inputPorts,
    rawOutputPorts: n.value.outputPorts
  }})
}

var mapPorts = (graphJSON, fn) => {
  return _.merge({}, graphJSON, {
    nodes: _.map(graphJSON.nodes, _.partial(mapPortsForNode, _, fn))
  })
}

var createParameters = (node, ignoreContinuations) => {
  var ports = _.merge({}, node.inputPorts, node.outputPorts)
  var inputs = _.intersection(node.settings.argumentOrdering, _.keys(node.inputPorts))
  var outputs = _.intersection(node.settings.argumentOrdering, _.keys(node.outputPorts))
  var mapper = _()
    .map((key) => ({name: key, type: ports[key]}))
    // .sortBy('name')
  return _.concat(mapper.plant(inputs).value(), mapper.plant(outputs).value(), additionalParameters(node, ignoreContinuations))
}

var safeQuery = (q, failureMessage) => {
  return q.catch(() => {
    throw new Error(failureMessage)
  })
}

var getCode = (arrayOfAtomics) => {
  return Promise.all(
    _(arrayOfAtomics)
    .filter((p) => p.atomic)
    .reject((p) => p.id === 'tailrec')
    .map(n => [
      n.id,
      safeQuery(lib.getCode(n.id, n.version, 'golang'), `Unable to query code for ${n.id}@${n.version}`),
      safeQuery(lib.getMeta(n.id, n.version, 'properties/golang'), `Unable to query properties for ${n.id}@${n.version}`),
      safeQuery(lib.getMeta(n.id, n.version, 'dependencies/golang'), `Unable to query dependencies for ${n.id}@${n.version}`)
    ])
    .flatten()
    .value()
  ).then(dataArray => _.chunk(dataArray, 4))
  .then(nodeArray => {
    return _.map(nodeArray, (nArr) => ({id: nArr[0], code: nArr[1], properties: nArr[2], dependencies: nArr[3]}))
  })
}

var imports = (processes) => {
  return _(processes)
    .map('dependencies')
    .flatten()
    .concat('sync')
    .compact()
    .uniq()
    .value()
}

/**
 * Returns a list of global definitions.
 */
var globals = (processes) => {
  // we do not have any global definitions (yet...)
  return []
}

var waitGroupPreDefinitions = (processes) => {
  var prefixes = _(processes)
    .filter((p) => p.properties && p.properties.needsWaitGroup)
    .map(() => 'wg.Add(1)')
    .value()
  if (prefixes.length !== 0) {
    return _.concat(['var wg sync.WaitGroup'], prefixes)
  } else {
    return []
  }
}

var waitGroupPostDefinitions = (processes) => {
  var prefixes = _.filter(processes, (p) => p.properties && p.properties.needsWaitGroup)
  if (prefixes.length !== 0) {
    return ['wg.Wait()']
  } else {
    return []
  }
}

var parent = function (graph, outP, inP) {
  if (graph.parent(outP.name) === graph.parent(inP.name)) {
    return graph.parent(outP.name)
  } else if (graph.parent(outP.name) === inP.process) {
    return inP.process
  } else if (graph.parent(inP.name) === outP.process) {
    return outP.process
  } else if (!graph.parent(outP.name) && graph.parent(inP.name)) {
    return graph.parent(inP.name)
  } else if (graph.parent(outP.name) && !graph.parent(inP.name)) {
    return graph.parent(outP.name)
  } else {
    throw new Error('Don\'t know what parent to use.. Please fix me!\n' +
    'Parent output: ' + graph.parent(outP.name) + ', parent input: ' + graph.parent(inP.name) + '\n' +
    JSON.stringify(outP) + ' , ' + JSON.stringify(inP))
  }
}

var rejectUnconnected = (graph, processes, channels) => {
  var newProcs = _(processes)
    .reject((p) => {
      if (_.keys(p.inputPorts).length === 0) return false
      return _.reduce(p.inputPorts, (res, type, name) => {
        return res || walk.predecessor(graph, p.name, name).length === 0
      }, false)
    })
    .value()
  return newProcs
}

const setLambdaImplementation = (graph, node) => {
  if (node.id === 'functional/lambda' &&
    (!node.params || !node.params.implementation)) {
    node.params = node.params || {}
    node.params.implementation = graph.children(node.name)[0]
  }
  return node
}

var api = {

  processes: (graph, ignoreContinuations = false) => {
    return _(graph.nodes()).chain()
    .filter(_.partial(isProcess, graph))
    .map(n => _.merge({}, graph.node(n),
        {name: n, hash: (graph.node(n).params) ? hash(graph.node(n).params) : ''},
        {parent: graph.parent(n) || 'main'}))
    .map(n => _.merge({}, n, {mangle: types.mangle(n)}, {arguments: createParameters(n, ignoreContinuations)}))
    .map(n => _.merge({}, n, {uid: (n.atomic) ? (n.id + n.hash + n.mangle) : n.name}))
    .map(n => setLambdaImplementation(graph, n))
    .value()
  },

  ports: (graph) => {
    return _(graph.nodes()).chain()
    .filter(_.partial(isPort, graph))
    .map(n => _.merge({}, graph.node(n), {name: n}))
    .value()
  },

  continuations: (graph) => {
    return _.map(_.filter(graph.edges(), (e) => graph.edge(e) && graph.edge(e).continuation),
      (e) => _.merge({}, e, {value: {target: e.w}}, {value: graph.edge(e)}))
  },

  resolveLambdas: (graph, typePrefix) => {
    return graphAPI.importJSON(mapPorts(graphAPI.toJSON(graph), _.partial(types.createLambdaFunctions, _, typePrefix)))
  },

  preprocess: (graph, sequential) => {
    var typePrefix = (sequential) ? '*' : 'chan '
    var lambdaGraph = api.resolveLambdas(graph, typePrefix)
    var graphJSON = graphlib.json.write(lambdaGraph)
    return getCode(api.processes(graph))
      .then((atomics) => {
        var atomicNameMap = _.keyBy(atomics, 'id')
        return graphlib.json.read(_.merge({}, graphJSON, {nodes: _.map(graphJSON.nodes, (n) => {
          if (_.has(atomicNameMap, n.value.id)) {
            if (!atomicNameMap[n.value.id].code) {
              throw new Error('Missing code for ' + n.value.id)
            }
            return _.merge({}, n, {value: atomicNameMap[n.value.id]})
          } else {
            return n
          }
        })}))
      })
  },

  atomics: (graph) => {
    return api.processes(graph).filter((p) => p.atomic)
  },

  /**
   * create channels from outPort to inPort
   */
  channels: (graph) => {
    var processesArray = api.processes(graph)
    var processes = _.keyBy(processesArray, 'name')
    var ports = api.ports(graph)
    var portsByName = _.keyBy(ports, 'name')
    return _(ports)
      .filter((p) => p.nodeType === 'outPort' || p.hierarchyBorder)
      .map((p) => {
        var processName = p.process
        var process = processes[processName]
        var channelType = ((p.nodeType !== 'outPort' && p.hierarchyBorder) ? process.inputPorts : process.outputPorts)[p.portName]
        return _.compact(_.map(graph.successors(p.name), (inPort) => {
          return { 'outPort': p.name, 'inPort': inPort, 'channelType': channelType, parent: parent(graph, p, portsByName[inPort]) || 'main' }
        }))
      })
      .flatten()
      .value()
  },

  compounds: (graph) => {
    var processes = api.processes(graph)
    var processesByName = _.keyBy(processes, 'name')
    var continuations = api.continuations(graph)
    var parentProperty = (process, type, def) => {
      if (_.has(processesByName, process)) {
        return processesByName[process][type]
      } else {
        return def
      }
    }
    var channels = api.channels(graph)
    if (processes.length === 0) {
      return [{ name: 'main', uid: 'main', processes: [], inputs: [], outputs: [], prefixes: [], channels: [] }]
    }
    var metaCompounds = _(processes)
      .groupBy('parent')
      .map((value, key) => (
        {
          name: key,
          id: parentProperty(key, 'id'),
          uid: (parentProperty(key, 'uid')) ? parentProperty(key, 'uid') : 'main',
          processes: rejectUnconnected(graph, value, _.filter(channels, (c) => c.parent === key)),
          inputPorts: parentProperty(key, 'inputPorts', {}), // FIXME: extend with parents process ports
          outputPorts: parentProperty(key, 'outputPorts', {}),
//          arguments: parentProperty(key, 'arguments', []),
          settings: parentProperty(key, 'settings', {}),
          prefixes: waitGroupPreDefinitions(value),
          postfixes: waitGroupPostDefinitions(value),
          channels: _.filter(channels, (c) => c.parent === key),
          continuations: _.filter(continuations, (c) => graph.parent(c.v) === key && graph.parent(c.w) === key)
        }))
      .toPairs()
      .map((p) => [p[1].uid || 'main', p[1]])
      .fromPairs()
      .value()
    var compounds = _(_.concat({uid: 'main'}, processes))
      .reject((p) => p.atomic)
      .map((c) => _.merge({}, metaCompounds[c.uid], c))
      .value()
    var newCompounds = _.map(compounds, (value, key) => {
      if (value.recursesTo) {
        return _.merge({}, value, {
          processes: metaCompounds[value.recursesTo.branchPath].processes,
          channels: metaCompounds[value.recursesTo.branchPath].channels,
          continuations: metaCompounds[value.recursesTo.branchPath].continuations
        })
      } else {
        return value
      }
    })
    return newCompounds
  },

  createSourceDescriptor: (graph) => {
    var processes = api.atomics(graph)
    var compounds = api.compounds(graph)
    return {
      imports: imports(processes),
      globals: globals(processes),
      processes: _.map(_.uniqBy(processes, 'uid'), codegen.createProcess),
      compounds: _.map(_.uniqBy(compounds, 'uid'), codegen.createCompound)
    }
  },

  generateCode: graph => {
    return codegen.createSource(api.createSourceDescriptor(graph))
  },

  generateSequentialCode: (graph) => {
    return sequential.generateCode(graph)
  }
}

export default api
