module.exports = (() => {
  const version = process.env.WEBPACK_VERSION

  let mod = null

  switch (process.env.WEBPACK_VERSION) {
    case '4':
      mod = require('webpack4')
      afterAll(async () => {
        // avoid jest open handle error with webpack4 testing
        await new Promise(resolve => setTimeout(() => resolve(''), 1000))
      })
      break
    case '5':
      mod = require('webpack5')
      break
    default:
      throw new Error(`Invalid or missing WEBPACK_VERSION: ${version}`)
  }

  return mod
})()
