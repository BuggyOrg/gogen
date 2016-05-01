
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
