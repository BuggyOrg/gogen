/* global describe, it */
import * as codegen from '../src/codegen.js'
import graphlib from 'graphlib'
import fs from 'fs'
import * as api from '../src/api.js'
var expect = require('chai').expect

describe('Codegen API', () => {
  it('can create code for a process', () => {
    var code = codegen.createProcess({name: 'proc', inputPorts: {'in': 'string'}, outputPorts: {'output': 'string'}, code: 'output++'})
    expect(code).to.be.a('string')
    expect(code.indexOf('func proc')).to.not.equal(-1)
    expect(code.indexOf('proc(output_chan chan string')).to.not.equal(-1)
    expect(code.indexOf('var output string')).to.not.equal(-1)
    expect(code.indexOf('output++')).to.not.equal(-1)
    expect(code.indexOf('output_chan <- output')).to.not.equal(-1)
    expect(code.indexOf('close(output_chan)')).to.not.equal(-1)
  })

  it('can create code for all atomics', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var atomics = api.atomics(graph)
    var code = atomics.map(codegen.createProcess).join('\n\n')
    expect(code.indexOf('func 0_STDIN')).to.not.equal(-1)
    expect(code.indexOf('func 2_STDOUT')).to.not.equal(-1)
  })

  it('can create code for a compound node', () => {
    var code = codegen.createCompound(
      {
        name: 'cmpd',
        inputPorts: {'in': 'string'},
        outputPorts: {'out': 'string'},
        prefixes: ['wg.Add(1)'],
        channels: [{type: 'string'}],
        processes: [{name: 'other', inputs: [], outputs: [], additionalParameters: ['*wg']}]
      })
    expect(code).to.be.a('string')
    expect(code.indexOf('func cmpd')).to.not.equal(-1)
    expect(code.indexOf('out chan string')).to.not.equal(-1)
    expect(code.indexOf('make(chan string)')).to.not.equal(-1)
    expect(code.indexOf('go other')).to.not.equal(-1)
  })
})
