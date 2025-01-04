/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["./src"],
    moduleFileExtensions: ["ts", "js"],
    testMatch: ["**/?(*.)+(spec|test).ts"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    collectCoverage: false,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
};
