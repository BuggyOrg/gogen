#!/usr/bin/env node
/* global __dirname, process */

import program from 'commander'
import fs from 'fs'
import getStdin from 'get-stdin'
import graphlib from 'graphlib'
import api from './api.js'

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json'))['version'])
  .option('-p, --processes', 'List processes only, does not generate any code')
  .option('-f, --graphfile <graphfile>', 'Set graph file to parse. If none is given stdin is read')
  .parse(process.argv)

var processGraph = str => {
  var graph = graphlib.json.read(JSON.parse(str))
  if (program.processes) {
    return api.processes(graph)
  }
  return api.generateCode(graph)
}

if (program.graphfile) {
  var str = fs.readFileSync(program.graphfile)
  console.log(processGraph(str))
} else {
  getStdin().then(str => {
    try {
      console.log(processGraph(str))
    } catch (e) {
      console.log('Error while processing: ', e)
    }
  })
}
