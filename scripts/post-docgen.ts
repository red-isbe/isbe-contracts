import * as fs from 'fs'
import * as path from 'path'
import { FileSystemError } from '../utils/errors'

interface FileMap {
    [directory: string]: string[]
}

/**
 * Configuration paths for documentation processing
 */
const paths = {
    contractsRoot: path.resolve(__dirname, '../contracts'),
    docsInput: path.resolve(__dirname, '../docs/generated-temp'),
    docsOutput: path.resolve(__dirname, '../docs/generated'),
} as const

/**
 * Clean up existing output directory
 */
function cleanOutputDirectory(): void {
    if (fs.existsSync(paths.docsOutput)) {
        fs.rmSync(paths.docsOutput, { recursive: true, force: true })
        console.log('🗑️  Deleting previously generated files...')
    }

    fs.mkdirSync(paths.docsOutput, { recursive: true })
}

/**
 * Find the path of a contract file by name
 * @param contractName - Name of the contract to find
 * @param dir - Directory to search in
 * @returns Full path to the contract file or null if not found
 */
function findContractPath(contractName: string, dir: string): string | null {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                const found = findContractPath(contractName, fullPath)
                if (found) return found
            } else if (entry.name === `${contractName}.sol`) {
                return fullPath
            }
        }
    } catch (error) {
        if (error instanceof Error && 'code' in error) {
            const nodeError = error as NodeJS.ErrnoException
            if (nodeError.code === 'ENOENT') {
                throw FileSystemError.fileNotFound(dir)
            } else if (nodeError.code === 'EACCES') {
                throw FileSystemError.permissionDenied(dir, 'read')
            }
        }
        console.warn(`⚠️  Warning: Cannot read directory ${dir}:`, error)
    }

    return null
}

/**
 * Process documentation files and organize them by directory
 * @returns FileMap containing organized documentation content
 */
function processDocumentationFiles(): FileMap {
    const fileMap: FileMap = {}

    if (!fs.existsSync(paths.docsInput)) {
        throw FileSystemError.fileNotFound(paths.docsInput)
    }

    console.log('🚀 Generating documentation files by directory...')

    try {
        const files = fs.readdirSync(paths.docsInput)

        for (const file of files) {
            if (!file.endsWith('.md')) continue

            const contractName = file.replace('.md', '')
            const contractPath = findContractPath(
                contractName,
                paths.contractsRoot
            )

            if (!contractPath) {
                console.warn(
                    `⚠️  Warning: Contract path not found for ${contractName}`
                )
                continue
            }

            const dir = path.relative(
                paths.contractsRoot,
                path.dirname(contractPath)
            )
            if (!fileMap[dir]) {
                fileMap[dir] = []
            }

            const content = fs
                .readFileSync(path.join(paths.docsInput, file), 'utf-8')
                .replace(/^#\s+Solidity API\s*\n?/m, '')

            fileMap[dir].push(content)
        }
    } catch (error) {
        if (error instanceof FileSystemError) {
            throw error // Re-throw FileSystemError as-is
        }
        console.error('❌ Error processing documentation files:', error)
        throw new FileSystemError(
            `Failed to process documentation files: ${error}`,
            paths.docsInput,
            'read'
        )
    }

    return fileMap
}

/**
 * Write organized documentation files to output directory
 * @param fileMap - Organized documentation content by directory
 */
function writeDocumentationFiles(fileMap: FileMap): void {
    const indexLines: string[] = ['# Module documentation index\n']

    const sortedDirs = Object.keys(fileMap).sort()

    for (const dir of sortedDirs) {
        const docs = fileMap[dir]
        const filename = `${dir || 'root'}.md`
        const outputFilePath = path.join(paths.docsOutput, filename)

        try {
            // Ensure directory exists
            fs.mkdirSync(path.dirname(outputFilePath), { recursive: true })

            // Write combined documentation content
            fs.writeFileSync(outputFilePath, docs.join('\n\n---\n\n'), 'utf-8')

            // Add to index
            indexLines.push(`- [${dir || 'root'}](${filename})`)

            console.log(`📄 Generated: ${filename}`)
        } catch (error) {
            throw new FileSystemError(
                `Failed to write documentation file: ${error}`,
                outputFilePath,
                'write'
            )
        }
    }

    // Write index file
    const indexPath = path.join(paths.docsOutput, 'INDEX.md')
    try {
        fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf-8')
        console.log('📚 INDEX.md generated with links to module docs.')
    } catch (error) {
        throw new FileSystemError(
            `Failed to write index file: ${error}`,
            indexPath,
            'write'
        )
    }
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles(): void {
    if (fs.existsSync(paths.docsInput)) {
        try {
            fs.rmSync(paths.docsInput, { recursive: true, force: true })
            console.log('🗑️  Deleting temp files...')
        } catch (error) {
            console.warn('⚠️  Warning: Could not delete temp files:', error)
            // Don't throw here as cleanup failure shouldn't fail the whole process
        }
    }
}

/**
 * Main execution function
 */
function main(): void {
    try {
        console.log('📖 Starting documentation post-processing...')

        // Clean up previous output
        cleanOutputDirectory()

        // Process and organize documentation files
        const fileMap = processDocumentationFiles()

        if (Object.keys(fileMap).length === 0) {
            console.warn('⚠️  Warning: No documentation files to process')
            return
        }

        // Write organized files
        writeDocumentationFiles(fileMap)

        // Clean up temporary files
        cleanupTempFiles()

        console.log(
            '✅ Documentation files by directory generated successfully.'
        )
    } catch (error) {
        if (error instanceof FileSystemError) {
            console.error(
                '❌ File system error during documentation processing:'
            )
            console.error('   Operation:', error.operation)
            console.error('   File path:', error.filePath)
            console.error('   Error:', error.message)
        } else {
            console.error('❌ Documentation post-processing failed:', error)
        }
        process.exit(1)
    }
}

// Execute the main function
main()
