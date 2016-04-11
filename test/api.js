/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var api = require('../src/api.js')
var expect = require('chai').expect
// import _ from 'lodash'

describe('Gogen API', () => {
  it('can create channels for a graph', () => {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var channels = api.channels(portGraph)
    expect(channels).to.have.length(1)
  })

  it('can create a list of all processes', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var procs = api.processes(graph)
    expect(procs).to.have.length(2)
  })

  it('assigns each process without a parent `main` as a parent', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var procs = api.processes(graph)
    expect(procs[0].parent).to.equal('main')
    expect(procs[1].parent).to.equal('main')
  })

  it('can create a list of compound nodes', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var cmpds = api.compounds(graph)
    expect(cmpds).to.have.length(1)
    expect(cmpds[0].processes).to.have.length(2)
    expect(cmpds[0].channels).to.have.length(1)
  })

  it('can add meta information to a graph', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    return api.preprocess(graph).then((newGraph) => {
      var procs = api.processes(newGraph)
      expect(procs).to.have.length(2)
      expect(newGraph.node('0_STDIN')).to.have.property('code')
      expect(newGraph.node('0_STDIN')).to.have.property('properties')
      expect(newGraph.node('0_STDIN')).to.have.property('dependencies')
    })
  })
})