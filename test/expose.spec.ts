import * as Hapi from '@hapi/hapi'
import { vol } from 'memfs'
import { BaseConfig } from './util/webpack'
import * as HapiWebpackPlugin from '../src'

jest.mock('fs')

beforeEach(() => {
  vol.reset()

  vol.fromJSON({ '/src/index.js': 'console.log(\'hello\');' })
})

describe('basic plugin test', () => {
  it('server decorations work', async () => {
    const server = new Hapi.Server()

    await server.register([{
      plugin: HapiWebpackPlugin.plugin,
      options: BaseConfig,
    }])

    const compiler = server.plugins['hapi-webpack-plugin'].compiler

    expect(compiler).not.toBeUndefined()
    expect(compiler.run).toBeInstanceOf(Function)
    expect(compiler.watch).toBeInstanceOf(Function)

    await server.stop()
  })
})
