import graphlib from 'graphlib'
import api from './api.js'
import * as codegen from './codegen'
import _ from 'lodash'
// import { compoundify } from '@buggyorg/graphtools'

var topsort = (graph) => {
  var g = graphlib.json.read(graphlib.json.write(graph))
  for (let node of graph.nodes()) {
    var n = g.node(node)
    if (n.process) var p = n.process
    if (n.hierarchyBorder && n.nodeType === 'inPort') {
      g.setEdge(node, p)
    }
    if (n.hierarchyBorder && n.nodeType === 'outPort') {
      g.setEdge(p, node)
    }
  }
  var sorted = graphlib.alg.topsort(g)
  var count = 0
  for (let node of sorted) {
    graph.node(node).topSort = count++
  }

  return graph
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

var sequential = {

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
          inputPorts: parentProperty(key, 'inputPorts', {}),
          outputPorts: parentProperty(key, 'outputPorts', {}),
          arguments: parentProperty(key, 'arguments', []),
          channels: _.filter(channels, (c) => c.parent === key)
        }))
      .value()
  },

  createSourceDescriptor: (graph) => {
    var processes = api.atomics(graph)
    var compounds = sequential.compounds(graph)
    return {
      imports: imports(processes),
      compounds: _.map(_.uniqBy(compounds, 'id'), codegen.createSeqCompound)
    }
  },

  generateCode: graph => {
    return codegen.createSeqSource(sequential.createSourceDescriptor(topsort(graph)))
  }
}

module.exports = sequential
