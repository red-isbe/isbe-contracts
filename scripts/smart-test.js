#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function getLastModified(dir) {
    if (!fs.existsSync(dir)) return 0

    let lastModified = 0
    const files = fs.readdirSync(dir, { recursive: true })

    for (const file of files) {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isFile()) {
            const mtime = fs.statSync(filePath).mtime.getTime()
            lastModified = Math.max(lastModified, mtime)
        }
    }
    return lastModified
}

function shouldCleanCache() {
    const contractsModified = getLastModified('./contracts')
    const testModified = getLastModified('./test')
    const artifactsModified = getLastModified('./artifacts')
    const typechainModified = getLastModified('./typechain-types')

    // Clean cache if source files are newer than artifacts
    const sourceModified = Math.max(contractsModified, testModified)
    const buildModified = Math.max(artifactsModified, typechainModified)

    return sourceModified > buildModified
}

function runTests() {
    const args = process.argv.slice(2)
    const testCommand =
        args.length > 0 ? `npx hardhat test ${args.join(' ')}` : 'npm run test'

    if (shouldCleanCache()) {
        console.log('🧹 Source files newer than artifacts, cleaning cache...')
        execSync('npm run clean:cache', { stdio: 'inherit' })
        execSync('npm run compile', { stdio: 'inherit' })
    }

    console.log('🚀 Running tests...')
    execSync(testCommand, { stdio: 'inherit' })
}

runTests()
