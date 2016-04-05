/* global describe, it */
import * as api from '../src/codegen.js'
var expect = require('chai').expect

describe('Codegen API', () => {
  it('can create code for a processes', () => {
    var code = api.createProcess({process: 'proc', inputs: [], outputs: [{name: 'output', type: 'string'}], code: 'output++'})
    expect(code).to.be.a('string')
    expect(code.indexOf('func proc')).to.not.equal(-1)
    expect(code.indexOf('proc(output_chan chan string')).to.not.equal(-1)
    expect(code.indexOf('var output string')).to.not.equal(-1)
    expect(code.indexOf('output++')).to.not.equal(-1)
    expect(code.indexOf('output_chan <- output')).to.not.equal(-1)
    expect(code.indexOf('close(output_chan)')).to.not.equal(-1)
  })

  it('can create code for a compound node', () => {
    var code = api.createCompound(
      {
        name: 'cmpd',
        inputs: [{name: 'in', type: 'string'}],
        outputs: [{name: 'out', type: 'string'}],
        prefixes: ['wg.Add(1)'],
        channels: [{type: 'string'}],
        processes: [{name: 'other', inputs: [], outputs: [], additionalParameters: ['*wg']}]
      })
    console.log(code)
    expect(code).to.be.a('string')
    expect(code.indexOf('func cmpd')).to.not.equal(-1)
    expect(code.indexOf('out chan string')).to.not.equal(-1)
    expect(code.indexOf('make(chan string)')).to.not.equal(-1)
    expect(code.indexOf('go other')).to.not.equal(-1)
  })
})
