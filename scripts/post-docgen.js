// scripts/merge-docs-by-dir.js
const fs = require('fs')
const path = require('path')

const contractsRoot = path.resolve(__dirname, '../contracts')
const docsInput = path.resolve(__dirname, '../docs/generated-temp')
const docsOutput = path.resolve(__dirname, '../docs/generated')

if (fs.existsSync(docsOutput)) {
    fs.rmSync(docsOutput, { recursive: true, force: true })
    console.log('🗑️  Deleting previously generated files...')
}

fs.mkdirSync(docsOutput, { recursive: true })

const fileMap = {}

console.log('🚀 Generating documentation files by directory...')

fs.readdirSync(docsInput).forEach((file) => {
    if (!file.endsWith('.md')) return

    const contractName = file.replace('.md', '')
    const contractPath = findContractPath(contractName, contractsRoot)
    if (!contractPath) return

    const dir = path.relative(contractsRoot, path.dirname(contractPath))
    if (!fileMap[dir]) fileMap[dir] = []

    const content = fs
        .readFileSync(path.join(docsInput, file), 'utf-8')
        .replace(/^#\s+Solidity API\s*\n?/m, '')

    fileMap[dir].push(content)
})

const indexLines = ['# Module documentation index\n']

for (const dir of Object.keys(fileMap).sort()) {
    const docs = fileMap[dir]
    const filename = `${dir || 'root'}.md`
    const outputFilePath = path.join(docsOutput, filename)

    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true })
    fs.writeFileSync(outputFilePath, docs.join('\n\n---\n\n'), 'utf-8')

    indexLines.push(`- [${dir || 'root'}](${filename})`)
}

const indexPath = path.join(docsOutput, 'INDEX.md')
fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf-8')
console.log('📚 INDEX.md generated with links to module docs.')

if (fs.existsSync(docsInput)) {
    fs.rmSync(docsInput, { recursive: true, force: true })
    console.log('🗑️  Deleting temp files...')
}

console.log('✅ Documentation files by directory generated successfully.')

function findContractPath(contractName, dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            const found = findContractPath(contractName, full)
            if (found) return found
        } else if (entry.name === `${contractName}.sol`) {
            return full
        }
    }
    return null
}
