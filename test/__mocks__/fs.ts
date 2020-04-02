import { fs as memfsFs } from 'memfs'
import { Union } from 'unionfs'

const fs = jest.requireActual('fs')

const ufs = new Union()

ufs
  .use(fs)
  .use(memfsFs as any)

module.exports = ufs
