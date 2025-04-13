import * as HapiWebpackPlugin from '../../src'

export const BaseConfig: HapiWebpackPlugin.Options = {
  dev: {
    publicPath: '/',
    stats: 'verbose',
    writeToDisk: true,
  },
  hot: {
    log: false,
  },
  webpackConfig: {
    infrastructureLogging: {
      appendOnly: true,
      level: 'log',
    },
    mode: 'development',
    target: 'web',
    stats: 'verbose',
    entry: {
      main: '/src/index.js',
    },
    output: {
      path: '/out',
      publicPath: '/',
      filename: '[name].js',
    },
  },
}
