
import * as handlebars from 'handlebars'
import fs from 'fs'
// import _ from 'lodash'

var replaceAll = (str, search, replacement) => {
  return str.split(search).join(replacement)
}

var sanitize = (str) => {
  return replaceAll(replaceAll(replaceAll(str, '/', '_'), ':', '__'), '>', '___')
}

handlebars.registerHelper('sanitize', sanitize)

var processTemplate = handlebars.compile(fs.readFileSync('./src/templates/process.hb', 'utf8'), {noEscape: true})
var compoundTemplate = handlebars.compile(fs.readFileSync('./src/templates/compound.hb', 'utf8'), {noEscape: true})
var sourceTemplate = handlebars.compile(fs.readFileSync('./src/templates/source.hb', 'utf8'), {noEscape: true})

/**
 * Create the source for a process
 * @process Expects a process format of {name: String, inputPorts: Array[{name: String, type: String}], outputPorts: Array[{name: String, type: String}], code: String}
 */
export { processTemplate as createProcess }

/**
 * Create the source for a coumpound node
 * @compound Expects a compound node with the following structure
 * {
 *   name: String,
 *   inputPorts: Array[{name: String, type: String}],
 *   outputPorts: Array[{name: String, type: String}],
 *   prefixes: Array[String],
 *   channels: Array[{?, type: String}],
 *   processes: Array[{name: String, inputs: Array[{name: String, type: String}], outputs: Array[{name: String, type: String}], additionalParameters: Array[String]}]
 * }
 */
export { compoundTemplate as createCompound }

export { sourceTemplate as createSource }
