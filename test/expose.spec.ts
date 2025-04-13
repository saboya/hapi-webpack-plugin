import * as Hapi from '@hapi/hapi'
import { vol } from 'memfs'
import * as webpack from 'webpack'
import { BaseConfig } from './util/webpack'
import * as HapiWebpackPlugin from '../src'

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
    expect(compiler).toBeInstanceOf(webpack.Compiler)

    await server.start()

    await server.stop()
  })
})
