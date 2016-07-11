import graphlib from 'graphlib'
import api from './api.js'
import * as codegen from './codegen'
import _ from 'lodash'
import { compoundify, utils, walk, graph as graphAPI } from '@buggyorg/graphtools'
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
  var sorted = graphAPI.topoSort(g)
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
    if (utils.isPortNode(n)) {
      var curNode = graph.node(n)
      var name = curNode.portName
      var type = curNode.type
      var port = utils.portNodePort(n)
      var process = utils.portNodeName(n)
      if (curNode.nodeType === 'inPort') {
        for (let pred of walk.predecessor(graph, process, port)) {
          if (graph.parent(pred.node) !== cmpd) {
            inputs[name + '__' + process] = type
            break
          }
        }
      } else if (curNode.nodeType === 'outPort') {
        for (let succ of walk.successor(graph, process, port)) {
          if (graph.parent(succ.node) !== cmpd) {
            outputs[name + '__' + process] = type
            break
          }
        }
      }
    }
  }
  return {
    inputPorts: inputs,
    outputPorts: outputs,
    atomic: false,
    name: cmpd,
    id: cmpd,
    settings: {argumentOrdering: _.concat(_.keys(inputs), _.keys(outputs)), packagedContinuation: true},
    nodeType: 'process'
  }
}

var addPortNodes = (graph, cmpd) => {
  for (let n of graph.nodes()) {
    if (graph.parent(n) !== cmpd || !utils.isPortNode(n)) { continue }
    var name = graph.node(n).portName
    var type = graph.node(n).type
    var process = utils.portNodeName(n)
    if (graph.node(n).nodeType === 'inPort') {
      for (let pred of graph.predecessors(n)) {
        if (graph.parent(pred) !== cmpd) {
          let pname = cmpd + '_PORT_' + name + '__' + process
          let plabel = {
            nodeType: 'inPort',
            portName: name + '__' + process,
            type: type,
            hierarchyBorder: true,
            process: cmpd }
          graph.setNode(pname, plabel)
          graph.setEdge(pname, n)
          graph.setEdge(pred, pname)
          graph.setParent(pname, graph.parent(cmpd))
          graph.removeEdge(pred, n)
        }
      }
    } else {
      for (let succ of graph.successors(n)) {
        if (graph.parent(succ) !== cmpd) {
          let pname = cmpd + '_PORT_' + name + '__' + process
          let plabel = {
            nodeType: 'outPort',
            portName: name + '__' + process,
            type: type,
            hierarchyBorder: true,
            process: cmpd }
          graph.setNode(pname, plabel)
          graph.setEdge(n, pname)
          graph.setEdge(pname, succ)
          graph.setParent(pname, graph.parent(cmpd))
          graph.removeEdge(n, succ)
        }
      }
    }
  }
  return graph
}

var walkMux = (graph, node, port, mux) => {
  if (node === mux) {
    return []
  } else {
    return _.keys(graph.node(node).outputPorts)
  }
}

var cmpndsByContPort = (graph, conts, name, mux) => {
  if (conts.length < 1) { return {graph} }
  var subset = _(conts)
    .map((c) => walk.walk(graph, c.node, _.partial(walkMux, _, _, _, mux), {keepDuplicates: true}))
    .flattenDeep()
    .uniq()
    .reject((m) => m === mux)
    .value()
  var newGraph = sequential.compoundify(graph, subset, name, conts)
  return {graph: newGraph, package: {node: name, value: cmpndLabel(newGraph, name)}}
}

const resolveMuxMuxContinuations = (graph, input) => {
  return _.flatten(_.map(input, (i) => {
    if (!i.type) {
      return graph.node(i.node).params.continuations
    } else {
      return i
    }
  }))
}

var cmpndsByCont = (graph, conts, mux) => {
  var c = _.groupBy(conts, (c) => c.port)
  var in1 = resolveMuxMuxContinuations(graph, c.input1)
  var in2 = resolveMuxMuxContinuations(graph, c.input2)
  var {graph: graph1, package: input1} = cmpndsByContPort(graph, in1 || [], mux + '_input1', mux)
  var {graph: graph2, package: input2} = cmpndsByContPort(graph1, in2 || [], mux + '_input2', mux)
  graph2.node(mux).params.packedContinuations = {input1, input2}
  return graph2
}

const hasContinuations = (node) => {
  return node.params && node.params.continuations
}

const isMuxMuxContinuation = (node) => {
  return node.params.continuations.length === 1 && !node.params.continuations[0].type
}

const muxMuxContinuation = (node) => {
  return node.params.continuations[0].node
}

const isPacked = (node) => {
  return node.params.packedContinuations
}

const isPackedMux = (graph, node) => {
  return !!isPacked(graph.node(muxMuxContinuation(node))) // && node.params.packedContinuations[node.params.continuations[0].port]
}

const activeMuxes = (graph, muxes) => {
  return _(muxes)
    .map((m) => graph.node(m))
    .filter((m) => hasContinuations(m) && !isPacked(m) &&
      (!isMuxMuxContinuation(m) || isPackedMux(graph, m)))
    .value()
}

var sequential = {

  compoundify: (graph, subset, name, continuations) => {
    if (!name) { name = 'compound' + hash(graph) }
    var preParent = graph.parent(subset[0])
    graph = compoundify.compoundify(graph, subset, name)
    graph.setNode(name, cmpndLabel(graph, name))
    graph.setParent(name, preParent)
    graph = addPortNodes(graph, name)
    _.each(continuations, (c) => {
      c.node = name
    })
    return graph
  },

  autoCompoundify: (graph) => {
    var muxes = utils.getAll(graph, 'logic/mux')
    var actives = activeMuxes(graph, muxes)
    var idx = 0
    while (actives.length > 0) {
      graph = _.reduce(actives, (acc, m) => cmpndsByCont(acc, m.params.continuations, m.branchPath), graph)
      actives = activeMuxes(graph, muxes)
      idx++
    }
    return graph
  },

  compounds: (graph) => {
    var processes = api.processes(graph, true)
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
    var metaCompounds = _(processes)
      .groupBy('parent')
      .map((value, key) => (
        {
          name: key,
          id: parentProperty(key, 'id'),
          uid: (parentProperty(key, 'uid')) ? parentProperty(key, 'uid') : 'main',
          processes: value,
          inputPorts: parentProperty(key, 'inputPorts', {}),
          outputPorts: parentProperty(key, 'outputPorts', {}),
          arguments: parentProperty(key, 'arguments', []),
          settings: parentProperty(key, 'settings', {}),
          channels: _.filter(channels, (c) => c.parent === key)
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

  createSourceDescriptor: (graph, options) => {
    var processes = api.atomics(graph)
    var compounds = sequential.compounds(graph)
    return {
      imports: imports(processes),
      compounds: _.map(_.uniqBy(compounds, 'uid'), _.partial(codegen.createSeqCompound, _, options))
    }
  },

  generateCode: (graph, options) => {
    return codegen.createSeqSource(
      sequential.createSourceDescriptor(
        topsort(sequential.autoCompoundify(graph)), options), options)
  }
}

module.exports = sequential
