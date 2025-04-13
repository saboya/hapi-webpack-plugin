const hapiVersion = process.env.HAPI_VERSION

let hapiPath = './node_modules/hapi' + hapiVersion

if (hapiVersion === '20') {
  hapiPath = './node_modules/@types/hapi__hapi'
}

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      diagnostics: {
        pathRegex: '\\.(spec|test)\\.ts$',
      },
      tsconfig: {
        paths: {
          '@hapi/hapi': [hapiPath],
        },
      },
    }],
  },
  roots: ['<rootDir>/test'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
  ],
  coverageReporters: [
    'text',
  ],
  setupFiles: [
    '<rootDir>/test/setup/fs.ts',
    '<rootDir>/test/setup/hapiVersion.ts',
  ],
}
