import _ from 'lodash'
import * as codegen from './codegen'
import graphlib from 'graphlib'

import libConnection from '@buggyorg/component-library'
var lib = libConnection(process.env.BUGGY_COMPONENT_LIBRARY_HOST)

var isProcess = (graph, n) => {
  return graph.node(n).nodeType === 'process' && graph.node(n).atomic === true
}

var isPort = (graph, n) => {
  return graph.node(n).nodeType === 'inPort' || graph.node(n).nodeType === 'outPort'
}

/*
var getChannelNameByInport = (channels, port) => {
  for (let channel of channels) {
    if (channel.inPort === port) {
      return channel.channelName
    }
  }
  return 'ERROR: getChannelNameByInport: ' + port
}

var getChannelNameByOutport = (channels, port) => {
  for (let channel of channels) {
    if (channel.outPort === port) {
      return channel.channelName
    }
  }
  return 'ERROR: getChannelNameByOutport: ' + port
}

var replaceAll = (str, search, replacement) => {
  return str.split(search).join(replacement)
}
*/
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

var api = {

  processes: graph => {
    return _(graph.nodes()).chain()
    .filter(_.partial(isProcess, graph))
    .map(n => _.merge({}, graph.node(n), {name: n}, {parent: graph.parent(n) || 'main'}))
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
    return _(ports)
      .filter((p) => p.nodeType === 'outPort')
      .map((p) => {
        var processName = p.process
        var process = processes[processName]
        var channelType = process.outputPorts[p.portName]
        return _.map(graph.successors(p.name), (succ) => {
          let inPort = succ
          while (graph.node(inPort).hierarchyBorder === true) {
            // we can assume there is exactly one successor
            inPort = graph.successors(succ)[0]
          }
          return { 'outPort': p.name, 'inPort': inPort, 'channelType': channelType, parent: p.parent || 'main' }
        })
      })
      .flatten()
      .value()
  },

  compounds: (graph) => {
    // TODO: Add inputs and outputs if not main. Those are stored in the node itself
    var processes = api.processes(graph)
    var channels = api.channels(graph)
    console.log(channels)
    return _(processes)
      .groupBy('parent')
      .map((value, key) => (
        {
          name: key,
          processes: value,
          inputs: [],
          outputs: [],
          prefixes: [],
          channels: _.filter(channels, (c) => c.parent === key)
        }))
      .value()
  },

  createSourceDescriptor: (graph) => {
    var processes = api.atomics(graph)
    var compounds = api.compounds(graph)
    return {
      imports: _.compact(_.map(processes, 'properties.imports')),
      globals: _.compact(_.map(processes, 'properties.globals')),
      processes: _.map(processes, codegen.createProcess),
      compounds: _.map(compounds, codegen.createCompound)
    }
  },

  generateCode: graph => {
    return codegen.createSource(api.createSourceDescriptor(graph))
    /*
    // Global Variables
    var processesArray = api.processes(graph)
    var processes = _.keyBy(processesArray, 'name')
    var channels = api.channels(graph)
    var imports = [ ]
    var needsWaitGroup = false

    // Code Variables
    var codePackage = 'package main\n'
    var codeImports = '// imports\n'
    var codeGlobals = '// global variables\n'
    var codeProcesses = '// process declarations\n'
    var codeMainPre = '// main function\nfunc main() {\n'
    var codeMainPost = ''
    var codeChannels = '// channels\n'
    var codeProcessesLaunch = '// start processes\n'

    // get all necessary information from server
    var allPromises = api.getCode(processesArray).then((allInfo) => {
      var nodesObject = _.keyBy(allInfo, 'id')

      // check imports, start processes and check for wait group dependencies
      for (let proc in processes) {
        let procObj = processes[proc]
        let procID = procObj.id
        let okCount = 0

        // code for function import of one single process
        let codeProcessHeader = ''
        let codeProcessPre = 'for {\n'
        let codeProcessFor = '// ###########\n' + nodesObject[procObj.id].code + '// ###########\n'
        let codeProcessPost = '}\n'

        // write function declaration and start it later
        codeProcessHeader += 'func ' + replaceAll(procID, '/', '_') + '('
        codeProcessesLaunch += 'go ' + replaceAll(procID, '/', '_') + '('

        for (let port in processes[proc]['inputPorts']) {
          // get name of the inPort
          let portName = ''
          for (let pred of graph.predecessors(proc)) {
            if (graph.node(pred).portName === port) { portName = pred }
          }
          let varName = port.split('/')[port.split('/').length - 1]
          let channelName = varName + '_chan'
          codeProcessHeader += channelName + ' chan ' + procObj['inputPorts'][port] + ', '
          codeProcessPre += varName + ',ok' + okCount + ' := <- ' + channelName + '\nif !ok' + okCount++ + ' { break }\n'
          codeProcessesLaunch += getChannelNameByInport(channels, portName) + ', '
        }

        for (let port in processes[proc]['outputPorts']) {
          // get name of the outPort
          let portName = ''
          for (let succ of graph.successors(proc)) {
            if (graph.node(succ).portName === port) { portName = succ }
          }
          let varName = port.split('/')[port.split('/').length - 1]
          let channelName = varName + '_chan'
          let channelType = procObj['outputPorts'][port]
          codeProcessHeader += channelName + ' chan ' + channelType + ', '
          codeProcessPre += 'var ' + varName + ' ' + channelType + '\n'
          codeProcessFor += channelName + ' <- ' + varName
          codeProcessPost += 'close(' + channelName + ')\n'
          codeProcessesLaunch += getChannelNameByOutport(channels, portName) + ', '
        }
        codeProcessHeader = codeProcessHeader.slice(0, -2) + ') {\n'

        // check for the need of a waitGroup
        if (_.has(nodesObject[procID], 'properties.needsWaitGroup')) {
          if (nodesObject[procID]['properties']['needsWaitGroup'] === true) {
            needsWaitGroup = true
            codeProcessPost += 'wg.Done()'
          }
        }
        codeProcessPost += '}\n\n'

        // combine the code snippets to a function
        codeProcesses += codeProcessHeader + codeProcessPre + codeProcessFor + codeProcessPost
        codeProcessesLaunch = codeProcessesLaunch.slice(0, -2) + ')\n'
      }

      for (let id in nodesObject) {
        // dependencies
        if (nodesObject[id]['dependencies']) {
          imports = _.concat(imports, nodesObject[id]['dependencies'])
        }
      }
      // add imports
      imports = _.uniq(imports)
      for (let imp of imports) {
        codeImports += 'import \"' + imp + '\"\n'
      }
      // add wait group, if necessary
      if (needsWaitGroup) {
        codeGlobals += 'var wg sync.WaitGroup\n'
        codeMainPre += 'wg.Add(1)\n'
        codeMainPost += 'wg.Wait()\n'
      }
      return codePackage + '\n' + codeImports + '\n' + codeGlobals + '\n' + codeProcesses + codeMainPre + '\n' + codeChannels + '\n' + codeProcessesLaunch + '\n' + codeMainPost + '}'
    })
    return allPromises
    */
  }
}

module.exports = api
