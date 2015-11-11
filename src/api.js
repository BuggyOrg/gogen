import {readFileSync} from 'fs'
import {Graph} from 'graphlib'

var api = {
  gatherAtomic: function (path) {
    var atomicString = readFileSync(path, 'utf8')
    console.log(atomicString)
    return atomicString
  },

  networkGraphFromAST: function (ast) {
    var g = new Graph({ compound: true })
    return g
  },

  codeFromNetworkGraph: function (netgraph) {
    return null
  },

  codeFromAst: function (ast) {
    return api.codeFromNetworkGraph(api.networkGraphFromAST(ast))
  }
}

module.exports = api
