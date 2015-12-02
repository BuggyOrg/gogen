/* global describe, it */
import {Graph} from 'graphlib'

var expect = require('chai').expect
var api = require('../src/api.js')

describe('Go Code Generator', function () {
  it('code from networkGraph', function () {
    var g = new Graph({ compound: true })

    api.codeFromNetworkGraph()
    expect(false).to.be.true
  })
})
