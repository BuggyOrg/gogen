
import hash from 'object-hash'
import {sanitize} from './utils.js'
import _ from 'lodash'

export function normalize (type) {
  if (type[0] === '[' && type[type.length - 1] === ']') {
    return '[]' + type.slice(1, -1)
  } else if (typeof (type) === 'object' && type.type === 'function') {
    return createLambdaFunctions(type)
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
  if (node.generic) {
    return sanitize(node.genericType)
  } else {
    return ''
  }
}

export function createLambdaFunctions (type) {
  if (typeof type === 'object' && type.arguments && type.return) {
    if (typeof type.return !== 'string') {
      throw new Error('multiple return values in lambda functions are not [yet] supported\n' + JSON.stringify(type))
    }
    var parameters = _.map(type.arguments, (type, key) => 'chan ' + normalize(type))
    return 'func (' + parameters.join(',') + ', chan ' + normalize(type.return) + ')'
  } else {
    return type
  }
}
