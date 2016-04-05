/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var api = require('../src/api.js')
var expect = require('chai').expect
import _ from 'lodash'

describe('Gogen API', () => {
  it('can create channels for a graph', () => {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/simplegraph.json')))
    var channels = api.channels(portGraph)
    expect(channels).to.have.length(1)
  })

  it('can create a list of all processes', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/simplegraph.json')))
    var procs = api.processes(graph)
    expect(procs).to.have.length(2)
  })

  it('assigns each process without a parent `main` as a parent', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/simplegraph.json')))
    var procs = api.processes(graph)
    expect(procs[0].parent).to.equal('main')
    expect(procs[1].parent).to.equal('main')
  })

  it('can create a list of compound nodes', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/simplegraph.json')))
    var cmpds = api.compounds(graph)
    console.log(JSON.stringify(cmpds, null, 2))
    expect(cmpds).to.have.length(1)
    expect(cmpds[0].processes).to.have.length(2)
    expect(cmpds[0].channels).to.have.length(1)
  })
})
