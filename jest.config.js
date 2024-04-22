/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"], // Include JS and JSX if needed
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "ts-jest",
  },
};
