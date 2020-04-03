import { Plugin, Server } from '@hapi/hapi'
import * as HistoryApiFallback from 'connect-history-api-fallback'
import * as Path from 'path'
import * as WebpackDevMiddleware from 'webpack-dev-middleware'
import * as WebpackHotMiddleware from 'webpack-hot-middleware'
import * as webpack from 'webpack'

import { injectHotMiddlewareConfig, setupConnectMiddleware } from './util'

declare module '@hapi/hapi' {
  interface PluginProperties {
    'hapi-webpack-plugin': {
      compiler: webpack.ICompiler
    }
  }
}

type HotMiddlewareServerOptions = Pick<WebpackHotMiddleware.Options, 'log' | 'path' | 'heartbeat'>
type HotMiddlewareClientOptions = Exclude<WebpackHotMiddleware.Options, 'log' | 'path' | 'heartbeat'>

type WebpackConfigSource = string | webpack.Configuration;

export interface Options {
  historyApiFallback?: boolean
  historyApiFallbackOptions?: HistoryApiFallback.Options
  webpackConfig: WebpackConfigSource
  dev?: WebpackDevMiddleware.Options
  hot?: HotMiddlewareServerOptions & HotMiddlewareClientOptions
}

const defaultOptions: Required<Pick<Options, 'historyApiFallback' | 'hot'>> = {
  historyApiFallback: false,
  hot: {
    reload: true,
  },
}

function getCompiler (options: Options & typeof defaultOptions): webpack.ICompiler {
  let config: webpack.Configuration

  if (typeof options.webpackConfig === 'string') {
    const configPath = Path.resolve(process.cwd(), options.webpackConfig)
    config = require(configPath) as webpack.Configuration
  } else {
    config = { ...options.webpackConfig }
  }

  return webpack(injectHotMiddlewareConfig(config, options.hot))
}

export const plugin: Plugin<Options> = {
  name: 'hapi-webpack-plugin',
  once: true,
  register: async (server, suppliedOptions) => {
    const options = { ...defaultOptions, ...suppliedOptions }

    const compilerPromise = new Promise<webpack.ICompiler>((resolve, reject) => {
      try {
        resolve(getCompiler(options))
      } catch (err) {
        reject(err)
      }
    })

    const compiler = await compilerPromise

    const webpackDevMiddlewarePromise = new Promise<ReturnType<typeof WebpackDevMiddleware>>((resolve, reject) => {
      try {
        resolve(WebpackDevMiddleware(compiler, options.dev))
      } catch (err) {
        reject(err)
      }
    })

    const webpackHotMiddlewarePromise = new Promise<ReturnType<typeof WebpackHotMiddleware>>((resolve, reject) => {
      try {
        resolve(WebpackHotMiddleware(compiler, options.hot))
      } catch (err) {
        reject(err)
      }
    })

    const webpackDevMiddleware = await webpackDevMiddlewarePromise
    const webpackHotMiddleware = await webpackHotMiddlewarePromise

    const validDevMiddlewarePromise = new Promise<void>((resolve, reject) => {
      try {
        webpackDevMiddleware.waitUntilValid(() => resolve())
      } catch (err) {
        reject(err)
      }
    })

    server.ext({
      type: 'onPreStop',
      method: async (_: Server) => {
        await Promise.all([
          compilerPromise,
          webpackDevMiddlewarePromise,
          webpackHotMiddlewarePromise,
          validDevMiddlewarePromise,
        ])

        return new Promise<void>((resolve) => webpackDevMiddleware.close(resolve))
      },
    })

    if (options?.historyApiFallback) {
      const HistoryApiFallbackMiddleware = HistoryApiFallback(options.historyApiFallbackOptions)

      setupConnectMiddleware(server, 'onRequest', HistoryApiFallbackMiddleware)
    }

    setupConnectMiddleware(server, 'onRequest', webpackDevMiddleware)
    setupConnectMiddleware(server, 'onRequest', webpackHotMiddleware)

    // Expose compiler
    server.expose('hapi-webpack-plugin', { compiler })
  },
}
