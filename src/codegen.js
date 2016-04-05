
import * as handlebars from 'handlebars'
import fs from 'fs'
import _ from 'lodash'

var processTemplate = handlebars.compile(fs.readFileSync('./src/templates/process.hb', 'utf8'))
var compoundTemplate = handlebars.compile(fs.readFileSync('./src/templates/compound.hb', 'utf8'))
var sourceTemplate = handlebars.compile(fs.readFileSync('./src/templates/source.hb', 'utf8'))

/**
 * Create the source for a process
 * @process Expects a process format of {process: String, inputs: Array[{name: String, type: String}], outputs: Array[{name: String, type: String}], code: String}
 */
export function createProcess (process) {
  return processTemplate(_.merge({}, process, {arguments: _.concat(process.inputs, process.outputs)}))
}

/**
 * Create the source for a coumpound node
 * @compound Expects a compound node with the following structure
 * {
 *   name: String,
 *   inputs: Array[{name: String, type: String}],
 *   outputs: Array[{name: String, type: String}],
 *   prefixes: Array[String],
 *   channels: Array[{?, type: String}],
 *   processes: Array[{name: String, inputs: Array[{name: String, type: String}], outputs: Array[{name: String, type: String}], additionalParameters: Array[String]}]
 * }
 */
export function createCompound (compound) {
  return compoundTemplate(_.merge({}, compound, {arguments: _.concat(compound.inputs, compound.outputs)}))
}

export function createSource (sourceDescriptor) {
  return sourceTemplate(sourceDescriptor)
}
