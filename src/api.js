// import {Graph} from 'graphlib'
import {getComponentLibrary, getCode} from '@buggyorg/component-library'
import _ from 'lodash'

const compLib = getComponentLibrary()

var api = {

  processes: graph => {
    return _(graph.nodes()).chain()
    .filter(n => graph.node(n).nodeType === 'process' && graph.node(n).type === 'atomic')
    .map(n => [n, graph.node(n)])
    .compact()
    .zipObject()
    .value()
  },

  processesMeta: graph => {
    return _(graph.nodes()).chain()
      .map(n => graph.node(n))
      .filter(n => n.nodeType === 'process')
      .compact()
      .map(n => [n.meta, compLib[n.meta]])
      .zipObject()
      .value()
  },

  ports: graph => {
    return _(graph.nodes()).chain()
      .filter(n => graph.node(n).nodeType === 'inPort' || graph.node(n).nodeType === 'outPort')
      .map(n => [n, graph.node(n)])
      .compact()
      .zipObject()
      .value()
  },

  generateCode: graph => {
    var codePackage = 'package main\n'
    var codeImports = '// imports\n'
    var codeProcesses = '// processes\n'
    var codeMainPre = ''
    var codeMainPost = ''
    var codeChannels = '// channels\n'

    var processes = api.processes(graph)
    var processesMeta = api.processesMeta(graph)
    var ports = api.ports(graph)
    var channels = [ ]
    var imports = [ ]

    var needsWaitGroup = false
    var channelCount = 0

    // create channels from outPort to inPort
    for (var port in ports) {
      if (ports[port].nodeType !== 'outPort') { continue }
      // we can assume there is exactly one predecessor
      var processName = graph.predecessors(port)[0]
      // skip hierarchy ports
      if (_.has(ports, processName)) { continue }
      var outPortName = ports[port].portName
      var processMeta = graph.node(processName).meta
      var channelType = processesMeta[processMeta].outputPorts[outPortName]

      for (let succ of graph.successors(port)) {
        var inPort = succ
        while (graph.node(inPort).hierarchyBorder === true) {
          // we can assume there is exactly one successor
          inPort = graph.successors(succ)[0]
        }
        // var inPortName = ports[inPort].portName
        channelCount++
        var channelName = 'chan' + channelCount
        codeChannels += channelName + ' := make(chan ' + channelType + ')\n'
        channels.push({ 'outPort': port, 'inPort': inPort, 'channelName': channelName, 'channelType': channelType })
      }
    }

    // check imports, start processes and check for wait group dependencies
    for (var proc in processesMeta) {
      // check if needs WaitGroup
      if (_.has(processesMeta[proc], '.meta.golang.needsWaitGroup')) {
        if (processesMeta[proc].meta.golang.needsWaitGroup) {
          needsWaitGroup = true
        }
      }

      // check for imports
      if (_.has(processesMeta[proc], '.dependencies.golang')) {
        var dependencies = processesMeta[proc].dependencies.golang
        Array.prototype.push.apply(imports, dependencies)
      }

      // get code needed for processes
      if (processesMeta[proc].atomic === true) {
        codeProcesses += getCode(proc, 'golang', compLib) + '\n'
      }
    }

    imports = _.unique(imports)
    for (let imp of imports) {
      codeImports += 'import \"' + imp + '\"\n'
    }

    if (needsWaitGroup) {
      codeMainPre += 'var wg sync.WaitGroup\nwg.Add(1)\n'
      codeMainPost += 'wg.Wait()\n'
    }

    for (var node in processes) {
      var codeLine = 'go NAMEHERE(\n'
      var pred = graph.predecessors(node)
      var succ = graph.successors(node)
    }

    console.log(processes)
    console.log(channels)
    return codePackage + '\n' + codeImports + '\n' + codeProcesses + 'func main() {\n' + codeMainPre + '\n' + codeChannels + '\n' + codeMainPost + '}'
  }
}

module.exports = api
