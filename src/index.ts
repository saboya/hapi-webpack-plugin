import { Plugin, Request, ResponseToolkit, Server } from '@hapi/hapi'
import * as HistoryApiFallback from 'connect-history-api-fallback'
import * as Path from 'path'
import * as WebpackDevMiddleware from 'webpack-dev-middleware'
import * as WebpackHotMiddleware from 'webpack-hot-middleware'
import * as webpack from 'webpack'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TimeFixPlugin = require('time-fix-plugin')

declare module '@hapi/hapi' {
  interface PluginProperties {
    'hapi-webpack-plugin': {
      compiler: webpack.ICompiler
    }
  }
}

type WebpackConfigSource = string | webpack.Configuration;

export interface Options {
  historyApiFallback?: boolean
  historyApiFallbackOptions?: HistoryApiFallback.Options
  webpackConfig: WebpackConfigSource
  dev?: WebpackDevMiddleware.Options
  hot?: WebpackHotMiddleware.Options
}

const defaultOptions: Required<Pick<Options, 'historyApiFallback'>> = {
  historyApiFallback: false,
}

function getCompiler (source: WebpackConfigSource): webpack.ICompiler {
  let config: webpack.Configuration

  if (typeof source === 'string') {
    const configPath = Path.resolve(process.cwd(), source)
    config = require(configPath) as webpack.Configuration
  } else {
    config = { ...source }
  }

  if (config.plugins === undefined) {
    config.plugins = []
  }

  config.plugins.push(new TimeFixPlugin())
  config.plugins.push(new webpack.HotModuleReplacementPlugin())

  if (typeof config.entry === 'string') {
    config.entry = [config.entry]
  }

  if (Array.isArray(config.entry)) {
    config.entry.push('webpack-hot-middleware/client')
  } else if (typeof config.entry === 'object') {
    config.entry['hapi-webpack-plugin-hmr-client'] = 'webpack-hot-middleware/client.js'
  }

  return webpack(config)
}

export const plugin: Plugin<Options> = {
  name: 'hapi-webpack-plugin',
  once: true,
  register: async (server, suppliedOptions) => {
    const options = { ...defaultOptions, ...suppliedOptions }

    server.event('compilation.finished')

    const compilerPromise = new Promise<webpack.ICompiler>((resolve, reject) => {
      try {
        resolve(getCompiler(options.webpackConfig))
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

    server.ext({
      type: 'onPreStop',
      method: async (_: Server) => {
        await Promise.all([compilerPromise, webpackDevMiddlewarePromise, webpackHotMiddlewarePromise])

        const validDevMiddlewarePromise = new Promise<void>((resolve, reject) => {
          try {
            webpackDevMiddleware.waitUntilValid(() => resolve())
          } catch (err) {
            reject(err)
          }
        })

        await validDevMiddlewarePromise

        const closeDevMiddlewarePromise = new Promise<void>((resolve, reject) => {
          try {
            webpackDevMiddleware.close(() => resolve())
          } catch (err) {
            reject(err)
          }
        })

        await closeDevMiddlewarePromise
      },
    })

    if (options?.historyApiFallback) {
      server.ext({
        type: 'onRequest',
        method: async (request: Request, h: ResponseToolkit) => {
          const { req, res } = request.raw

          const setupHistoryApiFallbackMiddleware = new Promise((resolve, reject) => {
            const handler = HistoryApiFallback(options.historyApiFallbackOptions)
            handler(req as any, res as any, error => {
              if (error !== undefined) {
                reject(error)
              }

              resolve()
            })
          })

          await setupHistoryApiFallbackMiddleware

          return h.continue
        },
      })
    }

    server.ext({
      type: 'onRequest',
      method: async (request: Request, h: ResponseToolkit) => {
        const { req, res } = request.raw

        const setupWebpackDevMiddleware = new Promise((resolve, reject) => {
          webpackDevMiddleware(req, res, error => {
            if (error !== undefined) {
              reject(error)
            }

            resolve()
          })
        })

        await setupWebpackDevMiddleware

        return h.continue
      },
    })

    server.ext({
      type: 'onRequest',
      method: async (request: Request, h: ResponseToolkit) => {
        const { req, res } = request.raw

        const setupWebpackHotMiddleware = new Promise((resolve, reject) => {
          webpackHotMiddleware(req, res, error => {
            if (error !== undefined) {
              reject(error)
            }

            resolve()
          })
        })

        await setupWebpackHotMiddleware

        return h.continue
      },
    })

    // Expose compiler
    server.expose('hapi-webpack-plugin', { compiler })
  },
}
