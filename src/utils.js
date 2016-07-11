
// import _ from 'lodash'

export function replaceAll (str, search, replacement) {
  return str.split(search).join(replacement)
}

export function sanitize (str) {
  if (typeof (str) !== 'string') {
    if (typeof JSON.stringify(str) !== 'string') {
      return '~non value~'
    }
    return sanitize(JSON.stringify(str))
  }
  // replace all but characters and numbers
  return str.replace(/([^0-9^A-Z^a-z_])/g, (c) => c.charCodeAt(0))
}

