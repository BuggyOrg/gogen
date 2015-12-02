import {Graph} from 'graphlib'

var api = {

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
