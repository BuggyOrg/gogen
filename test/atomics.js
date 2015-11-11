/* global describe, it */

var expect = require('chai').expect
var api = require('../src/api.js')

describe('Go Code Generator', function () {
  it('Read basic files using fs', function () {
    var strg = api.gatherAtomic('./atomics/test.go')
    expect(strg).to.deep.equal('HalloWelt\n')
  })

  it('networkGraphFromAST - definition', function () {
    var ast = [['def', 'Main', 'A']]
    var g = api.networkGraphFromAST(ast)
    expect(g.nodes()).to.have.length(3)
    expect(g.edges()).to.have.length(2)
  })

  it('networkGraphFromAST - subordinate', function () {
    var ast = [['def', 'Main', ['subordinate', 'STDIN', ['subordinate', 'STDIN', 'ADD']]]]
    api.networkGraphFromAST(ast)
    expect(false).to.be.true
  })
})
