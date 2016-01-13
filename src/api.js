// import {Graph} from 'graphlib'
import {getComponentLibrary} from '@buggyorg/component-library'
import _ from 'lodash'

const compLib = getComponentLibrary()

var api = {
  processes: graph => {
    return _(graph.nodes()).chain()
      .reject(n => n.indexOf('_PORT_') !== -1)
      .map(n => graph.node(n))
      .compact()
      .map(n => [n.meta, compLib[n.meta]])
      .zipObject()
      .value()
  },

  generateCode: graph => {
    // var processes = api.processes(graph)
    var codePackage = 'package main\n'
    var codeImports = '\n'
    var codeMain = 'func main() {\n'

    // TODO check if waitgroup is needed
    var needsWaitGroup = false

    if (needsWaitGroup) {
      codeMain += 'var wg sync.WaitGroup\nwg.Add(1)\n'
    }

    // TODO create channels
    // TODO start processes with channels

    if (needsWaitGroup) {
      codeMain += 'wg.Wait()\n'
    }

    codeMain += '}'

    return codePackage + codeImports + codeMain
  }
}

module.exports = api
