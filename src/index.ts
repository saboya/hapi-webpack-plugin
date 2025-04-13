import { Plugin, Server } from '@hapi/hapi'
import HistoryApiFallback from 'connect-history-api-fallback'
import * as Path from 'path'
import type { Options as WebpackDevMiddlewareOptions } from 'webpack-dev-middleware'
import WebpackDevMiddleware from 'webpack-dev-middleware'
import WebpackHotMiddleware from 'webpack-hot-middleware'
import type { IncomingMessage, ServerResponse } from 'node:http'
import webpack from 'webpack'

import { injectHotMiddlewareConfig, setupConnectMiddleware } from './util'

declare module '@hapi/hapi' {
  interface PluginProperties {
    'hapi-webpack-plugin': {
      compiler: webpack.Compiler
    }
  }
}

type WebpackConfigSource = string | webpack.Configuration

export interface Options {
  historyApiFallback?: boolean
  historyApiFallbackOptions?: HistoryApiFallback.Options
  webpackConfig: WebpackConfigSource
  dev?: WebpackDevMiddlewareOptions<IncomingMessage, ServerResponse>
  hot?: WebpackHotMiddleware.MiddlewareOptions & WebpackHotMiddleware.ClientOptions
}

const defaultOptions: Required<Pick<Options, 'historyApiFallback' | 'hot'>> = {
  historyApiFallback: false,
  hot: {
    reload: true,
  },
}

function getCompiler(options: Options & typeof defaultOptions): webpack.Compiler {
  let config: webpack.Configuration

  if (typeof options.webpackConfig === 'string') {
    const configPath = Path.resolve(process.cwd(), options.webpackConfig)
    config = require(configPath) as webpack.Configuration
  }
  else {
    config = { ...options.webpackConfig }
  }

  return webpack(injectHotMiddlewareConfig(config, options.hot))
}

export const plugin: Plugin<Options> = {
  name: 'hapi-webpack-plugin',
  once: true,
  register: (server, suppliedOptions) => {
    const options = { ...defaultOptions, ...suppliedOptions }

    const compiler = getCompiler(options)

    const webpackDevMiddleware = WebpackDevMiddleware(compiler, options.dev)

    const webpackHotMiddleware = WebpackHotMiddleware(compiler, options.hot)

    server.ext({
      type: 'onPreStop',
      method: async (_: Server) => new Promise<void>((resolve, reject) => webpackDevMiddleware.close((err) => {
        if (err === null || err === undefined) {
          resolve()
        }

        reject(err)
      })),
    })

    if (options?.historyApiFallback) {
      const HistoryApiFallbackMiddleware = HistoryApiFallback(options.historyApiFallbackOptions)

      setupConnectMiddleware(server, 'onRequest', HistoryApiFallbackMiddleware)
    }

    setupConnectMiddleware(server, 'onRequest', webpackDevMiddleware)
    setupConnectMiddleware(server, 'onRequest', webpackHotMiddleware)

    // Expose compiler
    server.expose('compiler', compiler)
  },
}
