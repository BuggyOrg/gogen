/* global describe, it */

var expect = require('chai').expect
var api = require('../src/api.js')

describe('Go Code Generator', function () {
  it('Read basic files using fs', function () {
    var strg = api.gatherAtomic('./atomics/test.go')
    expect(strg).to.deep.equal('HalloWelt\n')
  })
})
