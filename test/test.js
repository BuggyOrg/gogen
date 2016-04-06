/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var api = require('../src/api.js')
var expect = require('chai').expect
const exec = require('child_process').exec
import _ from 'lodash'

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

describe('Go Code Generator', function () {
  it('get processes from graph', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/typedtestgraph.graphlib')))
    var processes = api.processes(portGraph)
    expect(processes).to.be.ok
    expect(processes).to.have.length(6)

    var obj = _.keyBy(processes, 'id')
    expect(obj).to.include.keys('io/stdin')
    expect(obj).not.to.include.keys('math/inc')
  })

  it('get ports from graph', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/typedtestgraph.graphlib')))
    var ports = api.ports(portGraph)
    expect(ports).to.be.ok
    expect(ports).to.have.length(12)

    var obj = _.keyBy(ports, 'name')
    expect(obj).to.include.keys('1_INC_PORT_inc')
    expect(obj).not.to.include.keys('0_STDIN')
  })

  it('create code from preprocessed graph', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var code = api.generateCode(portGraph)
    fs.writeFileSync('test/fixtures/codeOutput.go', code)
    return executeCodePromise('echo 7 | go run test/fixtures/codeOutput.go', '7\n').then(() => {
      return executeCodePromise('go fmt test/fixtures/codeOutput.go', 'test/fixtures/codeOutput.go\n')
    })
  })

  it('create code for a real example graph', function () {
    var incGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/real_inc.json')))
    return api.preprocess(incGraph).then((graph) => {
      var code = api.generateCode(graph)
      fs.writeFileSync('test/fixtures/realInc.go', code)
      return executeCodePromise('echo 7 | go run test/fixtures/realInc.go', '8\n')
    })
    .then(() => {
      return executeCodePromise('go fmt test/fixtures/realInc.go', 'test/fixtures/realInc.go\n')
    })
  })

  it('empty graph to golang', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/emptytestgraph.graphlib')))
    var code = api.generateCode(portGraph)
    fs.writeFileSync('test/fixtures/emptyOutput.go', code)
    return executeCodePromise('echo 7 | go run test/fixtures/emptyOutput.go', '')
  })
})
