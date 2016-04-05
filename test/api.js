/* global describe, it */
var graphlib = require('graphlib')
var fs = require('fs')
var api = require('../src/api.js')
var expect = require('chai').expect
const exec = require('child_process').exec
import _ from 'lodash'

describe('Gogen API', () => {
  it('can create channels for a graph', () => {
    var portGraph = graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/simplegraph.json')))
    var channels = api.channels(portGraph)
    expect(channels).to.have.length(1)
  })
})