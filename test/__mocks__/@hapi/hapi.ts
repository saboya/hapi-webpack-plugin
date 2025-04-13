const version = process.env.HAPI_VERSION;

let mod = null

switch (process.env.HAPI_VERSION) {
  case '20':
    mod = require('hapi20')
    break
  case '21':
    mod = require('hapi21')
    break
  default:
    throw new Error(`Invalid or missing HAPI_VERSION: ${version}`)
}

module.exports = mod
