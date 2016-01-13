/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')

var expect = require('chai').expect
var api = require('../src/api.js')

describe('Go Code Generator', function () {
  it('code from networkGraph', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/testgraph.graphlib')))

    var code = api.generateCode(portGraph)
    console.log(code)
    expect(false).to.be.true
  })
})
