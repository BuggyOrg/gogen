/* global describe, it */
import * as codegen from '../src/codegen.js'
import graphlib from 'graphlib'
import fs from 'fs'
import api from '../src/api.js'
var expect = require('chai').expect

describe('Codegen API', () => {
  it('can create code for a process', () => {
    var code = codegen.createProcess({name: 'procc', uid: 'proc', inputPorts: {'in': 'string'}, outputPorts: {'output': 'string'}, code: 'output++', arguments: [{name: 'in', type: 'string'}, {name: 'output', type: 'string'}]})
    expect(code).to.be.a('string')
    expect(code).to.contain('func P_proc')
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
    expect(code).to.contain('func P_io47stdin')
    expect(code).to.contain('func P_io47stdout')
  })

  it('can create code for a compound node', () => {
    var code = codegen.createCompound(
      {
        name: 'cmpd',
        uid: 'cmpd',
        inputPorts: {'in': 'string'},
        outputPorts: {'out': 'string'},
        prefixes: ['wg.Add(1)'],
        channels: [{inPort: 'a', outPort: 'b', channelType: 'string'}],
        processes: [{name: 'other', uid: 'other', inputs: [], outputs: [], arguments: [], additionalParameters: ['*wg']}],
        arguments: [{name: 'in', type: 'string'}, {name: 'out', type: 'string'}]
      })
    expect(code).to.be.a('string')
    expect(code).to.contain('func P_cmpd')
    expect(code).to.contain('out_chan chan string')
    expect(code).to.contain('make(chan string)')
    expect(code).to.contain('chan_a := chan_b')
    expect(code).to.contain('go P_other')
  })

  it('recognizes special forms and uses custom implementations', () => {
    var code = codegen.createProcess({
      meta: 'control/join',
      name: 'join',
      uid: 'join',
      inputPorts: {
        in1: 'int',
        in2: 'int'
      },
      outputPorts: {
        to: 'int'
      },
      atomic: true,
      specialForm: true,
      code: `select {
{{#each inputPorts}}
  case {{sanitize @key}} := <- {{sanitize @key}}_chan:
    to_chan <- {{sanitize @key}}
{{/each}}
}`,
      arguments: [{name: 'in1', type: 'int'}, {name: 'in2', type: 'int'}, {name: 'to', type: 'int'}]
    })
    expect(code).to.contain('select')
    expect(code).to.contain('case in1 := <- in1_chan')
    expect(code).to.contain('case in2 := <- in2_chan')
    expect(code).to.contain('to_chan <- in1')
    expect(code).to.contain('to_chan <- in2')
  })
})
