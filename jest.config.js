/** @type {import('jest').Config} */
const config = {
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/src/__mocks__/obsidian.ts",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = config;
