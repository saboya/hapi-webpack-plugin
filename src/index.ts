import { Plugin, Request, ResponseToolkit, Server } from '@hapi/hapi'
import * as HistoryApiFallback from 'connect-history-api-fallback'
import * as Path from 'path'
import * as WebpackDevMiddleware from 'webpack-dev-middleware'
import * as WebpackHotMiddleware from 'webpack-hot-middleware'
import * as webpack from 'webpack'
import * as url from 'url'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TimeFixPlugin = require('time-fix-plugin')

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

function uriEncodeJSONObject (obj: object): string {
  return encodeURIComponent(JSON.stringify(obj))
}

function getCompiler (options: Options & typeof defaultOptions): webpack.ICompiler {
  let config: webpack.Configuration

  if (typeof options.webpackConfig === 'string') {
    const configPath = Path.resolve(process.cwd(), options.webpackConfig)
    config = require(configPath) as webpack.Configuration
  } else {
    config = { ...options.webpackConfig }
  }

  if (config.plugins === undefined) {
    config.plugins = []
  }

  config.plugins.push(new TimeFixPlugin())
  config.plugins.push(new webpack.HotModuleReplacementPlugin())

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { log, path, heartbeat, ansiColors, overlayStyles, ...rest } = options.hot

  const clientOpts: Record<string, any> = { ...rest }

  if (ansiColors !== undefined) {
    clientOpts.ansiColors = uriEncodeJSONObject(ansiColors)
  }

  if (overlayStyles !== undefined) {
    clientOpts.ansiColors = uriEncodeJSONObject(overlayStyles)
  }

  const hotMiddlewareClientParams = new url.URLSearchParams(clientOpts).toString()

  const resolvedClientModule = require.resolve('webpack-hot-middleware/client.js')

  const hotMiddlewareClientEntry = `${resolvedClientModule}?${hotMiddlewareClientParams}`

  if (typeof config.entry === 'string') {
    config.entry = { main: config.entry }
  }

  if (Array.isArray(config.entry)) {
    config.entry.push(hotMiddlewareClientEntry)
  } else if (typeof config.entry === 'object') {
    config.entry['hapi-webpack-plugin-hmr-client'] = hotMiddlewareClientEntry
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
