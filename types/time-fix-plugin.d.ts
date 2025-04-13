declare module 'time-fix-plugin' {
  import type { PlatformPlugin } from 'webpack'
  import { Compiler } from 'webpack-dev-middleware'

  class TimeFixPlugin extends PlatformPlugin {
    constructor(watchOffset?: number)

    public apply(compiler: Compiler): void
  }

  export = TimeFixPlugin
}
