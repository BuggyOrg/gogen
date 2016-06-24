/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var sequential = require('../src/sequential.js')
var expect = require('chai').expect
const exec = require('child_process').exec
import _ from 'lodash'
import api from '../src/api.js'

var executeCodePromise = (execution, expectation) => {
  return new Promise((resolve, reject) => {
    exec(execution,
      (error, stdout, stderr) => {
        expect(stdout).to.equal(expectation)
        if (error !== null) {
          console.log(`exec error: ${error}`)
          reject(error)
        } else {
          resolve()
        }
      })
  })
}

describe('Sequential Go Code Generator', function () {
  it('no compounds', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_add.json')))
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-no-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-no-compounds.go', '21').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-no-compounds.go', 'test/fixtures/seq-no-compounds.go\n')
      })
    })
  })

  it('one compound', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_inc.json')))
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-one-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-one-compounds.go', '5').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-one-compounds.go', 'test/fixtures/seq-one-compounds.go\n')
      })
    })
  })

  it('manual compoundify usage', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_add.json')))
    graph = sequential.compoundify(graph, ['add', 'add_PORT_s1', 'add_PORT_s2', 'add_PORT_sum'], 'test')
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-manual-compound.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-manual-compound.go', '21').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-manual-compound.go', 'test/fixtures/seq-manual-compound.go\n')
      })
    })
  })

  it('automatic compoundify', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/fac_mux.json')))
    graph = sequential.autoCompoundify(graph)
    expect(graph.node('fac_10:mux_0_input2')).to.be.ok
    expect(_.keys(graph.node('fac_10:mux_0_input2').inputPorts)).to.have.length(2)
    expect(_.keys(graph.node('fac_10:mux_0_input2').outputPorts)).to.have.length(1)
    expect(graph.parent('fac_10:mux_0_input2')).to.equal('fac_10')
  })

  it.only('creates function calls for recursions', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/fac_mux.json')))
    return api.preprocess(graph)
    .then((graph) => {
      var code = sequential.generateCode(graph)
      console.log(code)
    })
  })

  /*
  it('recursive compounds', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_fac.json')))
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-rec-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-rec-compounds.go', '24').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-rec-compounds.go', 'test/fixtures/seq-rec-compounds.go\n')
      })
    })
  })
  */
})
