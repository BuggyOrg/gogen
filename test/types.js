
/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var types = require('../src/types.js')
var expect = require('chai').expect
import _ from 'lodash'

describe('Type functions', () => {
  it('normalization of a builtin type doesn\'t change it', () => {
    expect(types.normalize('int')).to.equal('int')
    expect(types.normalize('int64')).to.equal('int64')
    expect(types.normalize('bool')).to.equal('bool')
    expect(types.normalize('string')).to.equal('string')
  })
  it('normalization of a array types creates a valid go array', () => {
    expect(types.normalize('[int]')).to.equal('[]int')
    expect(types.normalize('[bool]')).to.equal('[]bool')
    expect(types.normalize('[string]')).to.equal('[]string')
  })
  it('normalization does keep a valid go array notation', () => {
    expect(types.normalize('[]int')).to.equal('[]int')
    expect(types.normalize('[]bool')).to.equal('[]bool')
    expect(types.normalize('[]string')).to.equal('[]string')
  })
  it('can get the basic type in an array type', () => {
    expect(types.arrayType('[int]')).to.equal('int')
    expect(types.arrayType('[bool]')).to.equal('bool')
    expect(types.arrayType('[string]')).to.equal('string')
  })
})