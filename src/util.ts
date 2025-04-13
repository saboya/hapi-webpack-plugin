import { Request, ResponseToolkit, Server } from '@hapi/hapi'
import { Request as ExpressRequest, Response as ExpressServerResponse, RequestHandler } from 'express-serve-static-core'
import * as webpack from 'webpack'
import { ClientOptions, MiddlewareOptions } from 'webpack-hot-middleware'
import * as url from 'url'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TimeFixPlugin = require('time-fix-plugin')

function uriEncodeJSONObject (obj: object): string {
  return encodeURIComponent(JSON.stringify(obj))
}

export function setupConnectMiddleware (server: Server, event: Parameters<Server['ext']>[0], next: RequestHandler): void {
  server.ext({
    type: event,
    method: async (request: Request, h: ResponseToolkit) => new Promise((resolve, reject) => {
      const { req, res } = request.raw

      try {
        const maybePromise = next(
          req as unknown as ExpressRequest,
          res as unknown as ExpressServerResponse,
          err => err === undefined ? resolve(h.continue) : reject(err),
        )

        if (maybePromise?.then !== undefined) {
          maybePromise.catch(reject)
        }
      } catch (error) {
        reject(error)
      }
    }),
  })
}

export function injectHotMiddlewareConfig (suppliedConfig: webpack.Configuration, options: ClientOptions & MiddlewareOptions): webpack.Configuration {
  const config = { ...suppliedConfig }

  if (config.plugins === undefined) {
    config.plugins = []
  }

  config.plugins.push(new TimeFixPlugin())
  config.plugins.push(new webpack.HotModuleReplacementPlugin())

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { log, path, heartbeat, ansiColors, overlayStyles, ...rest } = options

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

  return config
}
