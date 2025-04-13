/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{
      "diagnostics": {
        "pathRegex": "\\.(spec|test)\\.ts$"
      }
    }],
  },
  roots: ["<rootDir>/test"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js}"
  ],
  coverageReporters: [
    "text"
  ],
};
