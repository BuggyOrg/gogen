import {Graph} from 'graphlib'
import {getComponentLibrary} from '@buggyorg/component-library'
import _ from 'lodash'

const compLib = getComponentLibrary()

var api = {
  processes: graph => {
    return _(graph.nodes()).chain()
      .reject(n => n.indexOf('_PORT_') != -1)
      .map(n => graph.node(n))
      .compact()
      .map(n => [n.meta, compLib[n.meta]])
      .zipObject()
      .value()
  },
  
  generateCode: graph => {
    var processes = api.processes(graph)
    return ""
  }
}

module.exports = api
