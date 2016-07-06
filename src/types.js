
import hash from 'object-hash'
import _ from 'lodash'

export function normalize (type, typePrefix) {
  if (type[0] === '[' && type[type.length - 1] === ']') {
    return '[]' + type.slice(1, -1)
  } else if (typeof (type) === 'object' && type.type === 'function') {
    return createLambdaFunctions(type, typePrefix)
  } else {
    return type
  }
}

/**
 * Returns the type basic type in an array type e.g. int for [int]
 */
export function arrayType (type) {
  return type.replace(/\[/g, '').replace(/\]/g, '')
}

export function isArrayType (type) {
  return type[0] === '[' && type[type.length - 1] === ']'
}

export function typeName (type) {
  if (typeof (type) === 'object') {
    return 'type_' + hash(type)
  } else {
    return type
  }
}

export function mangle (node) {
  if (node.settings && node.settings.isGeneric) {
    return hash(_.merge({}, node.inputPorts, node.outputPorts))
  } else {
    return ''
  }
}

export function createLambdaFunctions (type, typePrefix) {
  if (typeof type === 'object' && type.arguments) {
    if (typePrefix) {
      type.typePrefix = typePrefix
    }
    var outputs = type.outputs
    typePrefix = type.typePrefix
    var args = _.intersection(type.argumentOrdering, _.keys(type.arguments))
    var outArgs = _.intersection(type.argumentOrdering, _.keys(outputs))
    var parameters = _.concat(
        _.map(args, (key) =>
          typePrefix + ' ' + normalize(type.arguments[key], typePrefix)),
        _.map(outArgs, (key) =>
          typePrefix + ' ' + normalize(outputs[key], typePrefix)))
    return 'func (' + parameters.join(',') + ')'
  } else {
    return type
  }
}
