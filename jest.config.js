module.exports = {
    transform: {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment: 'node',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    roots: ['src', 'tests'],
    moduleDirectories: ["node_modules"],
    moduleNameMapper: {
        "^@/(.*)$": ["<rootDir>/src/$1"]
    }
};