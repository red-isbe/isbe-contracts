#!/usr/bin/env ts-node

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
-------------------------------------------------------------- */

import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------
// Configuration
// ---------------------------------------------------------

// Repository root assumed as parent of this script directory
const SCRIPT_DIR = __dirname
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')

// Directories to skip during traversal
const EXCLUDED_DIRS = new Set([
    'node_modules',
    'dist',
    'build',
    'coverage',
    'typechain',
    'typechain-types',
    '.husky',
])

// File extensions to process
const TARGET_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.sol', '.sh'])

// License contents (embedded, not read from files)

// JS / TS / JSX / TSX / SOL license (C-style comment)
const JS_LICENSE = `/* -----------------------------------------------------------------------------------
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
-------------------------------------------------------------- */`

// Shell license (hash-style comments)
const SH_LICENSE = `# --------------------------------------------------------------
# Copyright (c) 2025 Comunidad de Madrid & Alastria
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# --------------------------------------------------------------`

// Marker used to detect license presence (common text)
const COPYRIGHT_TEXT = 'Copyright (c) 2025 Comunidad de Madrid & Alastria'

// ---------------------------------------------------------
// CLI mode parsing
// ---------------------------------------------------------

type Mode = 'check' | 'addlicense'

function parseMode(argv: string[]): Mode {
    const modeArg = argv[2]

    if (!modeArg) {
        printUsageAndExit()
    }

    if (modeArg === 'check') {
        return 'check'
    }

    if (modeArg === 'addlicense' || modeArg === 'addlicence') {
        return 'addlicense'
    }

    console.error(`❌ Invalid mode: ${modeArg}`)
    printUsageAndExit()
}

function printUsageAndExit(): never {
    console.log('Usage: licenceTool.ts <check|addlicense>')
    console.log('  check       - Only report files without license')
    console.log('  addlicense  - Add license where missing (alias: addlicence)')
    process.exit(1)
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function isShellFile(filePath: string): boolean {
    return filePath.endsWith('.sh')
}

function hasTargetExtension(filePath: string): boolean {
    const ext = path.extname(filePath)
    return TARGET_EXTENSIONS.has(ext)
}

function shouldSkipFile(filePath: string): boolean {
    // Skip minified JS
    if (filePath.endsWith('.min.js')) {
        return true
    }
    return false
}

/**
 * Check if the file already has the license header.
 * We only inspect the first N lines to avoid false positives
 * coming from license text stored in variables later in the file.
 */
function hasLicense(filePath: string, isShell: boolean): boolean {
    const MAX_LINES_TO_CHECK = 40

    let content: string
    try {
        content = fs.readFileSync(filePath, 'utf8')
    } catch {
        // If we can't read, we treat as no license (but also effectively skip)
        return false
    }

    const lines = content.split(/\r?\n/)
    const head = lines.slice(0, MAX_LINES_TO_CHECK).join('\n')

    if (isShell) {
        // Expect a line starting with '#' and the copyright text
        const regex = new RegExp(
            String.raw`^[ \t]*#.*${escapeForRegExp(COPYRIGHT_TEXT)}`,
            'm'
        )
        return regex.test(head)
    } else {
        // JS-style: look for the copyright line near the top
        const regex = new RegExp(
            String.raw`^[ \t]*${escapeForRegExp(COPYRIGHT_TEXT)}`,
            'm'
        )
        return regex.test(head)
    }
}

/**
 * Escape a string so it can be safely used inside a RegExp constructor.
 */
function escapeForRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Add license header to a file.
 * - Preserves shebang line (#!) if present on first line
 * - Uses JS_LICENSE for non-shell files, SH_LICENSE for shell files
 */
function addLicenseToFile(filePath: string, isShell: boolean): void {
    console.log(`➕ Adding license to: ${filePath}`)

    const licenseText = isShell ? SH_LICENSE : JS_LICENSE
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)

    if (lines.length === 0) {
        // Empty file: just write the license
        fs.writeFileSync(filePath, licenseText + '\n', 'utf8')
        return
    }

    const firstLine = lines[0]

    if (firstLine.startsWith('#!')) {
        // Preserve shebang line at top
        const rest = lines.slice(1).join('\n')
        const newContent =
            firstLine +
            '\n\n' +
            licenseText +
            '\n' +
            (rest.length ? rest + '\n' : '')
        fs.writeFileSync(filePath, newContent, 'utf8')
    } else {
        // No shebang: prepend license at very top
        const newContent = licenseText + '\n' + content
        fs.writeFileSync(filePath, newContent, 'utf8')
    }
}

// ---------------------------------------------------------
// Directory traversal
// ---------------------------------------------------------

function walkDirectory(
    dir: string,
    callback: (filePath: string) => void
): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) {
                continue
            }
            walkDirectory(fullPath, callback)
        } else if (entry.isFile()) {
            callback(fullPath)
        }
    }
}

// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

function main() {
    const mode = parseMode(process.argv)

    console.log(`🔧 Mode: ${mode}`)
    console.log(`📂 Repository root: ${REPO_ROOT}`)
    console.log()

    let totalFiles = 0
    let missingCount = 0

    walkDirectory(REPO_ROOT, (filePath) => {
        if (!hasTargetExtension(filePath)) {
            return
        }
        if (shouldSkipFile(filePath)) {
            return
        }

        totalFiles++

        const shellFile = isShellFile(filePath)

        if (hasLicense(filePath, shellFile)) {
            if (mode === 'addlicense') {
                console.log(`🔁 Already licensed, skipping: ${filePath}`)
            }
            return
        }

        // Missing license
        missingCount++

        if (mode === 'check') {
            console.log(`❌ Missing license: ${filePath}`)
        } else {
            addLicenseToFile(filePath, shellFile)
        }
    })

    console.log()
    console.log(`📊 Processed files: ${totalFiles}`)

    if (mode === 'check') {
        if (missingCount === 0) {
            console.log('✅ All files already contain the license header.')
            process.exit(0)
        } else {
            console.log(`⚠️ Files missing license: ${missingCount}`)
            process.exit(1)
        }
    } else {
        console.log('✅ License application completed.')
        console.log(`   Files updated: ${missingCount}`)
        process.exit(0)
    }
}

main()
