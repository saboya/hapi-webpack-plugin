[![Build Status][workflow-image]][workflow-url] [![Maintenance Status][status-image]][status-url] [![NPM version][npm-image]][npm-url]

# @saboya/hapi-webpack-plugin


[Webpack](http://webpack.github.io) middleware for [Hapi](https://github.com/hapijs/hapi). Supports HMR.

This is a fork of Simon Degraeve's [hapi-webpack-plugin](https://github.com/SimonDegraeve/hapi-webpack-plugin).
This is mostly a rewrite of the plugin using TypeScript and updating it for current versions of Webpack / Hapi, with some added features.


### Webpack Version

This was tested with Webpack 4.41. Actual compatibility is unknown.

### Hapi version

Tested with Hapi 19. Should be compatible with Hapi >= 17.

## Installation

```
yarn add  @saboya/hapi-webpack-plugin
```

## Usage

See [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) and [webpack-hot-middleware](https://github.com/glenjamin/webpack-hot-middleware) for all available options.

Options for `webpack-dev-middleware` are set with the `dev` key in the options object.

Options for `webpack-hot-middleware` are set with the `hot` key in the options object.

**1) With object as options**

```typescript
import { Server } from '@hapi/hapi';
import { Plugin as HapiWebpackPlugin } from '@saboya/hapi-webpack-plugin';


/**
 * Create server
 */
const server = new Server();

/**
 * Register plugin and start server
 */
async function start() {
  await server.register({
    plugin: HapiWebpackPlugin,
    options: {
      dev: { // options for webpack-dev-middleware
        publicPath: '/',
      }, // options for webpack-hotmiddleware
      hot: {
        overlay: false,
      },
      webpackConfig: {
        entry: 'src.js'
      },
    },
  })
  
  await server.start();
}

start()
```

**2) With path as options**

```typescript
import { Server } from '@hapi/hapi';
import { Plugin as HapiWebpackPlugin } from '@saboya/hapi-webpack-plugin';


/**
 * Create server
 */
const server = new Server();

/**
 * Register plugin and start server
 */
async function start() {
  await server.register({
    plugin: HapiWebpackPlugin,
    options: {
      webpackConfig: './webpack.config.js'
    }
  })
  
  await server.start();
}

start()
```

## Licence

The MIT License (MIT)

Copyright (c) 2015 Simon Degraeve

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[workflow-url]: https://github.com/saboya/hapi-webpack-plugin/actions/workflows/node.js.yml
[workflow-image]: https://github.com/saboya/hapi-webpack-plugin/actions/workflows/node.js.yml/badge.svg?branch=master

[npm-url]: https://npmjs.org/package/@saboya/hapi-webpack-plugin
[npm-image]: http://img.shields.io/npm/v/@saboya/hapi-webpack-plugin.svg?style=flat-square

[status-url]: https://github.com/saboya/hapi-webpack-plugin/pulse
[status-image]: http://img.shields.io/badge/status-maintained-brightgreen.svg?style=flat-square
