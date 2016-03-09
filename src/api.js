import _ from 'lodash'

import libConnection from '@buggyorg/component-library'

var replaceAll = function (str, search, replacement) {
  return str.split(search).join(replacement)
}

var api = {

  processes: graph => {
    return _(graph.nodes()).chain()
    .filter(n => graph.node(n).nodeType === 'process' && graph.node(n).atomic === true)
    .map(n => [n, graph.node(n)])
    .compact()
    .fromPairs()
    .value()
  },

  ports: graph => {
    return _(graph.nodes()).chain()
    .filter(n => graph.node(n).nodeType === 'inPort' || graph.node(n).nodeType === 'outPort')
    .map(n => [n, graph.node(n)])
    .compact()
    .fromPairs()
    .value()
  },

  getChannelNameByInport: (channels, port) => {
    for (let channel of channels) {
      if (channel.inPort === port) {
        return channel.channelName
      }
    }
    return 'ERROR: getChannelNameByInport: ' + port
  },

  getChannelNameByOutport: (channels, port) => {
    for (let channel of channels) {
      if (channel.outPort === port) {
        return channel.channelName
      }
    }
    return 'ERROR: getChannelNameByOutport: ' + port
  },

  generateCode: graph => {
    // Global Variables
    var lib = libConnection('http://quasar:9200')
    var processes = api.processes(graph)
    var ports = api.ports(graph)
    var channels = [ ]
    var imports = [ ]
    var needsWaitGroup = false
    var channelCount = 0

    var PROPERTIES = 2
    var DEPENDENCIES = 3

    // Code Variables
    var codePackage = 'package main\n'
    var codeImports = '// imports\n'
    var codeGlobals = '// global variables\n'
    var codeProcesses = '// process declarations\n'
    var codeMainPre = '// main function\nfunc main() {\n'
    var codeMainPost = ''
    var codeChannels = '// channels\n'
    var codeProcessesLaunch = '// start processes\n'

    var getCodePromises = _(graph.nodes()).chain()
    .filter(n => graph.node(n).nodeType === 'process' && graph.node(n).atomic === true)
    .map(n => [
      graph.node(n).id,
      lib.getCode(graph.node(n).id, graph.node(n).version, 'golang'),
      lib.getMeta(graph.node(n).id, graph.node(n).version, 'properties/golang'),
      lib.getMeta(graph.node(n).id, graph.node(n).version, 'dependencies/golang')
    ])
    .flatten()
    .value()

    var allPromises = Promise.all(getCodePromises).then((promises) => {
      var nodeMeta = _.chunk(promises, 4)
      // {id: [id, code, prop, depend]}
      var nodesObj = _.keyBy(nodeMeta, function (nodeArr) { return nodeArr[0] })

      // create channels from outPort to inPort
      for (let port in ports) {
        if (ports[port].nodeType !== 'outPort') { continue }
        // we can assume there is exactly one predecessor
        let processName = graph.predecessors(port)[0]
        if (_.has(ports, processName)) { continue }
        let channelType = processes[processName].outputPorts[ports[port].portName]

        for (let succ of graph.successors(port)) {
          let inPort = succ
          while (graph.node(inPort).hierarchyBorder === true) {
            // we can assume there is exactly one successor
            inPort = graph.successors(succ)[0]
          }
          let channelName = 'chan' + channelCount++
          codeChannels += channelName + ' := make(chan ' + channelType + ')\n'
          channels.push({ 'outPort': port, 'inPort': inPort, 'channelName': channelName, 'channelType': channelType })
        }
      }

      // check imports, start processes and check for wait group dependencies
      for (let proc in processes) {
        let procObj = processes[proc]
        let procID = procObj.id
        let okCount = 0

        // code
        let codeProcessHeader = ''
        let codeProcessPre = 'for {\n'
        let codeProcessFor = '// ###########\n' + nodesObj[procObj.id][1] + '// ###########\n'
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
          codeProcessesLaunch += api.getChannelNameByInport(channels, portName) + ', '
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
          codeProcessesLaunch += api.getChannelNameByOutport(channels, portName) + ', '
        }

        codeProcessHeader = codeProcessHeader.slice(0, -2) + ') {\n'

        if (_.has(nodesObj[procID], '.2.needsWaitGroup')) {
          if (nodesObj[procID][PROPERTIES]['needsWaitGroup'] === true) {
            needsWaitGroup = true
            codeProcessPost += 'wg.Done()'
          }
        }
        codeProcessPost += '}\n\n'

        codeProcesses += codeProcessHeader + codeProcessPre + codeProcessFor + codeProcessPost
        codeProcessesLaunch = codeProcessesLaunch.slice(0, -2) + ')\n'
      }

      for (let id in nodesObj) {
        // dependencies
        if (nodesObj[id][DEPENDENCIES]) {
          imports = _.concat(imports, nodesObj[id][DEPENDENCIES])
        }
      }

      imports = _.uniq(imports)
      for (let imp of imports) {
        codeImports += 'import \"' + imp + '\"\n'
      }

      if (needsWaitGroup) {
        codeGlobals += 'var wg sync.WaitGroup\n'
        codeMainPre += 'wg.Add(1)\n'
        codeMainPost += 'wg.Wait()\n'
      }

      var stringOutput = codePackage + '\n' + codeImports + '\n' + codeGlobals + '\n' + codeProcesses + codeMainPre + '\n' + codeChannels + '\n' + codeProcessesLaunch + '\n' + codeMainPost + '}'
      return stringOutput
    })

    return allPromises
  }
}

module.exports = api
