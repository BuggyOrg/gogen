import _ from 'lodash'
import * as codegen from './codegen'
import graphlib from 'graphlib'

import libConnection from '@buggyorg/component-library'
var lib = libConnection(process.env.BUGGY_COMPONENT_LIBRARY_HOST)

var isProcess = (graph, n) => {
  return graph.node(n).nodeType === 'process'
}

var isPort = (graph, n) => {
  return graph.node(n).nodeType === 'inPort' || graph.node(n).nodeType === 'outPort'
}

var additionalParameters = (node) => {
  if (node.properties && node.properties.needsWaitGroup) {
    return [{name: 'wg', type: 'sync.WaitGroup', inputPrefix: '*', passingPrefix: '&'}]
  }
  return []
}

var createParameters = (node) => {
  var mapper = _()
    .map((type, key) => ({name: key, type: type}))
    .sortBy('name')
  return _.concat(mapper.plant(node.inputPorts).value(), mapper.plant(node.outputPorts).value(), additionalParameters(node))
}

var getCode = (arrayOfAtomics) => {
  return Promise.all(
    _(arrayOfAtomics)
    .filter((p) => p.atomic)
    .map(n => [
      n.id,
      lib.getCode(n.id, n.version, 'golang'),
      lib.getMeta(n.id, n.version, 'properties/golang'),
      lib.getMeta(n.id, n.version, 'dependencies/golang')
    ])
    .flatten()
    .value()
  ).then(dataArray => _.chunk(dataArray, 4))
  .then(nodeArray => {
    return _.map(nodeArray, (nArr) => ({id: nArr[0], code: nArr[1], properties: nArr[2], dependencies: nArr[3]}))
  })
}

var imports = (processes) => {
  return _.uniq(_.compact(_.flatten(_.map(processes, 'dependencies'))))
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
  } else {
    return outP.process
  }
}

var api = {

  processes: graph => {
    return _(graph.nodes()).chain()
    .filter(_.partial(isProcess, graph))
    .map(n => _.merge({}, graph.node(n),
        {name: n},
        {parent: graph.parent(n) || 'main'},
        {arguments: createParameters(graph.node(n))}))
    .value()
  },

  ports: graph => {
    return _(graph.nodes()).chain()
    .filter(_.partial(isPort, graph))
    .map(n => _.merge({}, graph.node(n), {name: n}))
    .value()
  },

  preprocess: (graph) => {
    var graphJSON = graphlib.json.write(graph)
    return getCode(api.processes(graph))
      .then((atomics) => {
        var atomicNameMap = _.keyBy(atomics, 'id')
        return graphlib.json.read(_.merge({}, graphJSON, {nodes: _.map(graphJSON.nodes, (n) => {
          if (_.has(atomicNameMap, n.value.id)) {
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
        return _.map(graph.successors(p.name), (succ) => {
          let inPort = succ
          // while (graph.node(inPort).hierarchyBorder === true) {
            // we can assume there is exactly one successor
            // inPort = graph.successors(succ)[0]
          // }
          return { 'outPort': p.name, 'inPort': inPort, 'channelType': channelType, parent: parent(graph, p, portsByName[inPort]) || 'main' }
        })
      })
      .flatten()
      .value()
  },

  compounds: (graph) => {
    // TODO: Add inputs and outputs if not main. Those are stored in the node itself
    var processes = api.processes(graph)
    var processesByName = _.keyBy(processes, 'name')
    var parentProperty = (process, type, def) => {
      if (_.has(processesByName, process)) {
        return processesByName[process][type]
      } else {
        return def
      }
    }
    var channels = api.channels(graph)
    if (processes.length === 0) {
      return [{ name: 'main', processes: [], inputs: [], outputs: [], prefixes: [], channels: [] }]
    }
    return _(processes)
      .groupBy('parent')
      .map((value, key) => (
        {
          name: key,
          id: parentProperty(key, 'id'),
          processes: value,
          inputPorts: parentProperty(key, 'inputPorts', {}), // FIXME: extend with parents process ports
          outputPorts: parentProperty(key, 'outputPorts', {}),
          arguments: parentProperty(key, 'arguments', []),
          prefixes: waitGroupPreDefinitions(value),
          postfixes: waitGroupPostDefinitions(value),
          channels: _.filter(channels, (c) => c.parent === key)
        }))
      .value()
  },

  createSourceDescriptor: (graph) => {
    var processes = api.atomics(graph)
    var compounds = api.compounds(graph)
    return {
      imports: imports(processes),
      globals: globals(processes),
      processes: _.map(_.uniqBy(processes, 'id'), codegen.createProcess),
      compounds: _.map(_.uniqBy(compounds, 'id'), codegen.createCompound)
    }
  },

  generateCode: graph => {
    return codegen.createSource(api.createSourceDescriptor(graph))
  }
}

module.exports = api
