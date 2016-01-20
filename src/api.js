// import {Graph} from 'graphlib'
import {getComponentLibrary} from '@buggyorg/component-library'
import _ from 'lodash'

const compLib = getComponentLibrary()

var api = {

  processes: graph => {
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
      // .map(n => [n.meta, compLib[n.meta]])
      .zipObject()
      .value()
  },

  generateCode: graph => {
    var codePackage = 'package main\n'
    var codeImports = '\n'
    var codeMain = 'func main() {\n'
    var codeChannels

    var processes = api.processes(graph)
    var ports = api.ports(graph)

    // var channels = [ ]
    console.log(processes)
    console.log('-+-+-+-+-+-+-+-')
    console.log(ports)
    console.log('-+-+-+-+-+-+-+-')

    var needsWaitGroup = false
    for (var key in processes) {
      if (_.has(processes[key], '.meta.golang.needsWaitGroup')) {
        if (processes[key].meta.golang.needsWaitGroup) {
          needsWaitGroup = true
        }
      }
    }

    if (needsWaitGroup) {
      codeMain += 'var wg sync.WaitGroup\nwg.Add(1)\n'
    }

    // create channels
    for (var port in ports) {
      var portName = ports[port].portName
      var processName
      var processMeta
      var channelType

      if (ports[port].nodeType === 'inPort') {
        processName = graph.successors(port)[0]
        // skip hierarchy ports
        if (_.has(ports, processName)) { continue }
        processMeta = graph.node(processName).meta
        channelType = processes[processMeta].inputPorts[portName]
      } else if (ports[port].nodeType === 'outPort') {
        processName = graph.predecessors(port)[0]
        // skip hierarchy ports
        if (_.has(ports, processName)) { continue }
        processMeta = graph.node(processName).meta
        channelType = processes[processMeta].outputPorts[portName]
      } else {
        console.log(port)
        console.log(ports[port])
        console.log(ports[port].nodeType)
        console.log('CHANNEL CREATION WENT HORRIBLY WRONG')
        return
      }
      console.log(portName + ' ' + channelType)
    }

    // TODO start processes with channels

    if (needsWaitGroup) {
      codeMain += 'wg.Wait()\n'
    }

    return codePackage + codeImports + codeMain + codeChannels + '}'
  }
}

module.exports = api
