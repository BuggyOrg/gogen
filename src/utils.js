
import _ from 'lodash'

export function replaceAll (str, search, replacement) {
  return str.split(search).join(replacement)
}

export function sanitize (str) {
  if (typeof (str) !== 'string') {
    return sanitize(JSON.stringify(str))
  }
  var replace = ['/', ':', '>', '[', ']', ' ', '(', ')', ',', '-', '{', '}', '"', ' ', '+', '→']
  return _.reduce(replace, replaceAll, str)
}
