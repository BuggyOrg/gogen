/* global describe, it */
import * as codegen from '../src/codegen.js'
import graphlib from 'graphlib'
import fs from 'fs'
import * as api from '../src/api.js'
var expect = require('chai').expect

describe('Codegen API', () => {
  it('can create code for a process', () => {
    var code = codegen.createProcess({id: 'proc', inputPorts: {'in': 'string'}, outputPorts: {'output': 'string'}, code: 'output++', arguments: [{name: 'in', type: 'string'}, {name: 'output', type: 'string'}]})
    expect(code).to.be.a('string')
    expect(code).to.contain('func proc')
    expect(code).to.contain('proc(in_chan chan string , output_chan chan string )')
    expect(code).to.contain('var output string')
    expect(code).to.contain('output++')
    expect(code).to.contain('output_chan <- output')
    expect(code).to.contain('close(output_chan)')
  })

  it('can create code for all atomics', () => {
    var graph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/preproc.json')))
    var atomics = api.atomics(graph)
    var code = atomics.map(codegen.createProcess).join('\n\n')
    expect(code).to.contain('func io_stdin')
    expect(code).to.contain('func io_stdout')
  })

  it('can create code for a compound node', () => {
    var code = codegen.createCompound(
      {
        name: 'cmpd',
        inputPorts: {'in': 'string'},
        outputPorts: {'out': 'string'},
        prefixes: ['wg.Add(1)'],
        channels: [{inPort: 'a', outPort: 'b', channelType: 'string'}],
        processes: [{name: 'other', id: 'other', inputs: [], outputs: [], arguments: [], additionalParameters: ['*wg']}],
        arguments: [{name: 'in', type: 'string'}, {name: 'out', type: 'string'}]
      })
    expect(code).to.be.a('string')
    expect(code).to.contain('func cmpd')
    expect(code).to.contain('out chan string')
    expect(code).to.contain('make(chan string)')
    expect(code).to.contain('chan_b := chan_a')
    expect(code).to.contain('go other')
  })
})
