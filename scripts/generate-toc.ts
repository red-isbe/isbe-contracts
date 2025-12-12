/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import * as fs from 'fs'
import * as path from 'path'

// Interface to store information about each markdown file
interface MarkdownFile {
    title: string // The title extracted from the first # heading
    relativePath: string // The relative path from the root folder
    absolutePath: string // The full path to the file
    folderPath: string // The folder containing this file
}

// Interface to organize files by folder
interface FolderContents {
    [folderPath: string]: MarkdownFile[]
}

// Interface for gitignore patterns
interface GitignorePattern {
    pattern: string
    isNegation: boolean
    isDirectory: boolean
}

/**
 * Parses a .gitignore file and returns an array of patterns
 * @param gitignorePath - Path to the .gitignore file
 * @returns Array of gitignore patterns
 */
function parseGitignore(gitignorePath: string): GitignorePattern[] {
    if (!fs.existsSync(gitignorePath)) {
        return []
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8')
    const lines = content.split('\n')
    const patterns: GitignorePattern[] = []

    lines.forEach((line) => {
        // Remove comments and trim whitespace
        const trimmed = line.split('#')[0].trim()

        // Skip empty lines
        if (!trimmed) {
            return
        }

        // Check if it's a negation pattern (starts with !)
        const isNegation = trimmed.startsWith('!')
        const pattern = isNegation ? trimmed.substring(1) : trimmed

        // Check if it's a directory pattern (ends with /)
        const isDirectory = pattern.endsWith('/')

        patterns.push({
            pattern: isDirectory ? pattern.slice(0, -1) : pattern,
            isNegation,
            isDirectory,
        })
    })

    return patterns
}

/**
 * Converts a gitignore pattern to a regex pattern
 * @param pattern - The gitignore pattern
 * @returns RegExp object
 */
function gitignorePatternToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    let regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        // ** matches any number of directories
        .replace(/\*\*/g, '<<DOUBLE_STAR>>')
        // * matches anything except /
        .replace(/\*/g, '[^/]*')
        // ? matches any single character except /
        .replace(/\?/g, '[^/]')
        // Restore ** pattern
        .replace(/<<DOUBLE_STAR>>/g, '.*')

    // If pattern starts with /, it's anchored to root
    if (pattern.startsWith('/')) {
        regexPattern = '^' + regexPattern.substring(1)
    } else {
        // Otherwise it can match anywhere in the path
        regexPattern = '(^|/)' + regexPattern
    }

    // Match the pattern to the end or to a directory separator
    regexPattern += '($|/)'

    return new RegExp(regexPattern)
}

/**
 * Checks if a path should be ignored based on gitignore patterns
 * @param relativePath - Path relative to the root directory
 * @param patterns - Array of gitignore patterns
 * @param isDirectory - Whether the path is a directory
 * @returns true if the path should be ignored
 */
function shouldIgnore(
    relativePath: string,
    patterns: GitignorePattern[],
    isDirectory: boolean
): boolean {
    // Normalize path to use forward slashes
    const normalizedPath = relativePath.split(path.sep).join('/')

    let ignored = false

    patterns.forEach(
        ({ pattern, isNegation, isDirectory: patternIsDirectory }) => {
            // Skip directory-specific patterns if checking a file
            if (patternIsDirectory && !isDirectory) {
                return
            }

            const regex = gitignorePatternToRegex(pattern)

            if (
                regex.test(normalizedPath) ||
                regex.test('/' + normalizedPath)
            ) {
                ignored = !isNegation
            }
        }
    )

    return ignored
}

/**
 * Recursively finds all .md files in a directory and its subdirectories
 * @param dir - The directory to search
 * @param rootDir - The original root directory (for calculating relative paths)
 * @param gitignorePatterns - Array of gitignore patterns to respect
 * @param fileList - Accumulator array for found files
 * @returns Array of absolute paths to .md files
 */
function findMarkdownFiles(
    dir: string,
    rootDir: string = dir,
    gitignorePatterns: GitignorePattern[] = [],
    fileList: string[] = []
): string[] {
    // Read all items in the current directory
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        const relativePath = path.relative(rootDir, filePath)

        // Check if this path should be ignored
        if (shouldIgnore(relativePath, gitignorePatterns, stat.isDirectory())) {
            console.log(`Skipping ignored path: ${relativePath}`)
            return
        }

        // If it's a directory, recursively search it
        if (stat.isDirectory()) {
            findMarkdownFiles(filePath, rootDir, gitignorePatterns, fileList)
        }
        // If it's a .md file, add it to our list
        else if (path.extname(file).toLowerCase() === '.md') {
            fileList.push(filePath)
        }
    })

    return fileList
}

/**
 * Extracts the first H1 title from a markdown file
 * @param filePath - Path to the markdown file
 * @returns The title without the # character, or null if no valid title found
 */
function extractTitle(filePath: string): string | null {
    try {
        // Read the file content
        const content = fs.readFileSync(filePath, 'utf-8')

        // Split into lines and find the first non-empty line
        const lines = content.split('\n')

        for (const line of lines) {
            const trimmedLine = line.trim()

            // Check if the line starts with exactly one # followed by a space
            // This regex ensures: ^ (start), # (one hash), \s (whitespace), [^#] (not another hash)
            if (/^#\s+[^#]/.test(trimmedLine)) {
                // Extract the title by removing the # and trimming whitespace
                return trimmedLine.substring(1).trim()
            }

            // If we encounter a non-empty line that isn't a valid H1, stop searching
            if (trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
                break
            }
        }

        return null // No valid H1 title found
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error)
        return null
    }
}

/**
 * Groups markdown files by their parent folder and applies priority rules
 * @param files - Array of MarkdownFile objects
 * @returns Object with folder paths as keys and arrays of MarkdownFile as values
 */
function organizeFilesByFolder(files: MarkdownFile[]): FolderContents {
    const folderContents: FolderContents = {}

    // Group files by their folder
    files.forEach((file) => {
        if (!folderContents[file.folderPath]) {
            folderContents[file.folderPath] = []
        }
        folderContents[file.folderPath].push(file)
    })

    // Apply priority rules: if README.md or INDEX.md exists, keep only that file
    Object.keys(folderContents).forEach((folderPath) => {
        const filesInFolder = folderContents[folderPath]

        // Check for README.md (case-insensitive)
        const readme = filesInFolder.find(
            (f) => path.basename(f.absolutePath).toLowerCase() === 'readme.md'
        )

        // Check for INDEX.md (case-insensitive)
        const index = filesInFolder.find(
            (f) => path.basename(f.absolutePath).toLowerCase() === 'index.md'
        )

        // Priority: README.md takes precedence, then INDEX.md
        if (readme) {
            folderContents[folderPath] = [readme]
        } else if (index) {
            folderContents[folderPath] = [index]
        }
        // Otherwise, keep all files in the folder
    })

    return folderContents
}

/**
 * Generates the markdown table of contents
 * @param folderContents - Organized files by folder
 * @param rootDir - The root directory for generating relative paths
 * @returns Formatted markdown string
 */
function generateTableOfContents(
    folderContents: FolderContents,
    rootDir: string
): string {
    let markdown = '# Table of Contents\n\n'

    // Sort folders alphabetically for consistent output
    const sortedFolders = Object.keys(folderContents).sort()

    sortedFolders.forEach((folderPath) => {
        const files = folderContents[folderPath]

        // Calculate relative folder path from root
        const relativeFolderPath = path.relative(rootDir, folderPath)

        // Add folder header if not the root folder
        if (relativeFolderPath !== '') {
            markdown += `## ${relativeFolderPath}\n\n`
        } else {
            markdown += `## Root\n\n`
        }

        // Sort files alphabetically within each folder
        files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))

        // Add each file as a link
        files.forEach((file) => {
            // Format: - [Title](./relative/path/to/file.md)
            markdown += `- [${file.title}](${file.relativePath})\n`
        })

        markdown += '\n' // Add spacing between folders
    })

    return markdown
}

/**
 * Main function to process markdown files and generate table of contents
 * @param targetFolder - The folder to scan for markdown files
 */
function main(targetFolder: string): void {
    console.log(`Scanning folder: ${targetFolder}`)

    // Resolve to absolute path
    const absoluteTargetFolder = path.resolve(targetFolder)

    // Check if the folder exists
    if (!fs.existsSync(absoluteTargetFolder)) {
        console.error(`Error: Folder "${targetFolder}" does not exist.`)
        process.exit(1)
    }

    // Parse .gitignore if it exists
    const gitignorePath = path.join(absoluteTargetFolder, '.gitignore')
    const gitignorePatterns = parseGitignore(gitignorePath)

    if (gitignorePatterns.length > 0) {
        console.log(
            `Found .gitignore with ${gitignorePatterns.length} patterns.`
        )
    }

    // Find all markdown files (respecting .gitignore)
    const markdownFilePaths = findMarkdownFiles(
        absoluteTargetFolder,
        absoluteTargetFolder,
        gitignorePatterns
    )
    console.log(`Found ${markdownFilePaths.length} markdown files.`)

    // Process each file to extract titles
    const validFiles: MarkdownFile[] = []

    markdownFilePaths.forEach((filePath) => {
        const title = extractTitle(filePath)

        if (title) {
            // Calculate relative path with forward slashes and ./ prefix
            let relativePath = path.relative(absoluteTargetFolder, filePath)
            // Normalize to forward slashes (important for cross-platform compatibility)
            relativePath = relativePath.split(path.sep).join('/')
            // Add ./ prefix
            relativePath = './' + relativePath

            validFiles.push({
                title,
                relativePath,
                absolutePath: filePath,
                folderPath: path.dirname(filePath),
            })
        } else {
            console.log(`Skipping ${filePath} - no valid H1 title found.`)
        }
    })

    console.log(`Processing ${validFiles.length} files with valid titles.`)

    // Organize files by folder and apply priority rules
    const folderContents = organizeFilesByFolder(validFiles)

    // Generate the table of contents markdown
    const tocMarkdown = generateTableOfContents(
        folderContents,
        absoluteTargetFolder
    )

    // Write to TABLE_OF_CONTENT.md in the target folder
    const outputPath = path.join(absoluteTargetFolder, 'TABLE_OF_CONTENT.md')
    fs.writeFileSync(outputPath, tocMarkdown, 'utf-8')

    console.log(`\nTable of contents generated successfully!`)
    console.log(`Output file: ${outputPath}`)
}

// Execute the script
// Get the target folder from command line arguments, or use current directory
const targetFolder = process.argv[2] || '.'
main(targetFolder)
