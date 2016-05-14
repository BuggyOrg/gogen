
import _ from 'lodash'
import hash from 'object-hash'
import {sanitize} from './utils.js'

export function normalize (type) {
  if (type[0] === '[' && type[type.length - 1] === ']') {
    return '[]' + type.slice(1, -1)
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
