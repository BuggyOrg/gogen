import graphlib from 'graphlib'
import api from './api.js'
import * as codegen from './codegen'
import _ from 'lodash'
import { compoundify } from '@buggyorg/graphtools'
import hash from 'object-hash'

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

var cmpndLabel = (graph, cmpd) => {
  var inputs = {}
  var outputs = {}

  for (let n of graph.nodes()) {
    if (graph.parent(n) !== cmpd) { continue }
    var name = graph.node(n).portName
    var type = graph.node(n).type
    // if (graph.predecessors(n).length === 0) { inputs[name] = type }
    for (let pred of graph.predecessors(n)) {
      if (graph.parent(pred) !== cmpd) {
        inputs[name] = type
        break
      }
    }
    // if (graph.successors(n).length === 0) { outputs[name] = type }
    for (let succ of graph.successors(n)) {
      if (graph.parent(succ) !== cmpd) {
        outputs[name] = type
        break
      }
    }
  }
  return {
    inputPorts: inputs,
    outputPorts: outputs,
    atomic: false,
    name: cmpd,
    id: cmpd,
    nodeType: 'process' }
}

var addPortNodes = (graph, cmpd) => {
  for (let n of graph.nodes()) {
    if (graph.parent(n) !== cmpd) { continue }
    var name = graph.node(n).portName
    var type = graph.node(n).type
    for (let pred of graph.predecessors(n)) {
      if (graph.parent(pred) !== cmpd) {
        let pname = cmpd + '_PORT_' + graph.node(n).portName
        let plabel = {
          nodeType: 'inPort',
          portName: name,
          type: type,
          hierarchyBorder: true,
          process: cmpd }
        graph.setNode(pname, plabel)
        graph.setEdge(pname, n)
        graph.setEdge(pred, pname)
        graph.removeEdge(pred, n)
      }
    }
    for (let succ of graph.successors(n)) {
      if (graph.parent(succ) !== cmpd) {
        let pname = cmpd + '_PORT_' + graph.node(n).portName
        let plabel = {
          nodeType: 'outPort',
          portName: name,
          type: type,
          hierarchyBorder: true,
          process: cmpd }
        graph.setNode(pname, plabel)
        graph.setEdge(n, pname)
        graph.setEdge(pname, succ)
        graph.removeEdge(n, succ)
      }
    }
  }
  return graph
}

var sequential = {

  compoundify: (graph, subset, name) => {
    if (!name) { name = 'compound' + hash(graph) }
    graph = compoundify.compoundify(graph, subset, name)
    graph.setNode(name, cmpndLabel(graph, name))
    graph = addPortNodes(graph, name)
    return graph
  },

  autoCompoundify: (graph) => {
    return graph
  },

  compounds: (graph) => {
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
