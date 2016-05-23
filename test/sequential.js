/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var sequential = require('../src/sequential.js')
var api = require('../src/api.js')
var expect = require('chai').expect
const exec = require('child_process').exec
// import _ from 'lodash'
import { compoundify } from '@buggyorg/graphtools'

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
  it('create sequential code - no compounds', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_add.json')))
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-no-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-no-compounds.go', '21').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-no-compounds.go', 'test/fixtures/seq-no-compounds.go\n')
      })
    })
  })
})

describe('Sequential Go Code Generator', function () {
  it('create sequential code - one compound', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_inc.json')))
    graph = compoundify.compoundify(graph, ['inc:add', 'inc:add_PORT_s1', 'inc:add_PORT_s2', 'inc:add_PORT_sum'])
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-one-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-one-compounds.go', '5').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-one-compounds.go', 'test/fixtures/seq-one-compounds.go\n')
      })
    })
  })
})

describe('Sequential Go Code Generator', function () {
  it('create sequential code - recursive compounds', function () {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_fac.json')))
    return api.preprocess(graph).then((newGraph) => {
      var code = sequential.generateCode(newGraph)
      fs.writeFileSync('test/fixtures/seq-rec-compounds.go', code)
      return executeCodePromise('echo 4 | go run test/fixtures/seq-rec-compounds.go', '24').then(() => {
        return executeCodePromise('go fmt test/fixtures/seq-rec-compounds.go', 'test/fixtures/seq-rec-compounds.go\n')
      })
    })
  })
})
