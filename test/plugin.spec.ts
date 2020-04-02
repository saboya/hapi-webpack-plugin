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
  it('plugin registers without errors', async () => {
    const server = new Hapi.Server()

    await server.register([{
      plugin: HapiWebpackPlugin.plugin,
      options: BaseConfig,
    }])

    await server.start()

    await server.stop()
  })

  it('files are saved in the desired path', async () => {
    const server = new Hapi.Server()

    await server.register([{
      plugin: HapiWebpackPlugin.plugin,
      options: BaseConfig,
    }])

    await server.start()

    await server.stop()
  })
})
