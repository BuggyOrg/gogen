/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var api = require('../src/api.js')
var expect = require('chai').expect
const exec = require('child_process').exec

describe('Go Code Generator', function () {
  it('INC-NPG to golang', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/typedtestgraph.graphlib')))
    var code = api.generateCode(portGraph)
    return code.then((out) => {
      fs.writeFileSync('test/fixtures/codeOutput.go', out)
    }).then(() => {
      return new Promise((resolve, reject) => {
        exec('echo 7 | go run test/fixtures/codeOutput.go',
          (error, stdout, stderr) => {
            expect(stdout).to.equal('8\n')
            if (error !== null) {
              console.log(`exec error: ${error}`)
              reject(error)
            } else {
              resolve()
            }
          })
      })
    })
  })

  it('empty graph to golang', function () {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/emptytestgraph.graphlib')))
    var code = api.generateCode(portGraph)
    return code.then((out) => {
      fs.writeFileSync('test/fixtures/emptyOutput.go', out)
    }).then(() => {
      return new Promise((resolve, reject) => {
        exec('echo 7 | go run test/fixtures/emptyOutput.go',
          (error, stdout, stderr) => {
            expect(stdout).to.equal('')
            if (error !== null) {
              console.log(`exec error: ${error}`)
              reject(error)
            } else {
              resolve()
            }
          })
      })
    })
  })
})
