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
----------------------------------------------------------------------------------- */

/**
 * EIP-7825 transaction gas limit guard.
 *
 * The Osaka hard fork caps the gas limit of a single transaction at 2^24
 * (16,777,216) gas units. A transaction declaring more than that is rejected
 * by the node. The failure is silent at fork activation: the network keeps
 * producing blocks and only deployment or bootstrap scripts break, later.
 *
 * This script scans the repository for per-transaction gas limits above the
 * cap and exits non-zero if it finds any.
 */

import * as fs from 'fs'
import * as path from 'path'
import { MAX_TX_GAS_LIMIT } from '../utils/constants'

const REPO_ROOT = path.resolve(__dirname, '..')

const EXCLUDED_DIRS = new Set([
    '.git',
    '.github',
    'artifacts',
    'build',
    'cache',
    'coverage',
    'docs',
    'node_modules',
    'typechain-types',
])

/**
 * Files whose large gas numbers are deliberately above the cap because they
 * are NOT per-transaction gas limits: the gas report denominator and the
 * coverage tooling configuration.
 */
const EXCLUDED_FILES = new Set([
    '.solcover.js',
    'scripts/format-gas-summary.ts',
])

const TARGET_EXTENSIONS = new Set(['.ts', '.js', '.mjs'])

/**
 * Matches `gasLimit` or `gas` assigned a numeric literal (decimal, hex or
 * bigint). Case-sensitive on purpose: it must NOT match `blockGasLimit`
 * (a block limit, not a transaction limit) nor the ERC-4337 UserOperation
 * fields `callGasLimit`, `verificationGasLimit`, `paymasterPostOpGasLimit`
 * and friends, which are internal call budgets rather than transaction
 * gas limits. All of those spell it with a capital G.
 */
const GAS_ASSIGNMENT =
    /(?:^|[^A-Za-z0-9_])(gasLimit|gas)\s*[:=]\s*['"]?(0x[0-9a-fA-F]+|\d[\d_]*)n?/g

interface Violation {
    file: string
    line: number
    raw: string
    value: number
    text: string
}

function parseLiteral(raw: string): number | undefined {
    const clean = raw.replace(/_/g, '')
    const value = clean.startsWith('0x')
        ? Number.parseInt(clean, 16)
        : Number.parseInt(clean, 10)
    return Number.isNaN(value) ? undefined : value
}

function collectFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        // Skip macOS resource fork files
        if (entry.name.startsWith('._')) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue
            collectFiles(full, acc)
        } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
            acc.push(full)
        }
    }
    return acc
}

function scanFile(file: string): Violation[] {
    const relative = path.relative(REPO_ROOT, file)
    if (EXCLUDED_FILES.has(relative)) return []

    const violations: Violation[] = []
    const lines = fs.readFileSync(file, 'utf8').split('\n')

    lines.forEach((text, index) => {
        for (const match of text.matchAll(GAS_ASSIGNMENT)) {
            const value = parseLiteral(match[2])
            if (value === undefined || value <= MAX_TX_GAS_LIMIT) continue
            violations.push({
                file: relative,
                line: index + 1,
                raw: match[2],
                value,
                text: text.trim(),
            })
        }
    })

    return violations
}

function main(): void {
    const cap = MAX_TX_GAS_LIMIT.toLocaleString('en-US')
    const violations = collectFiles(REPO_ROOT).flatMap(scanFile)

    if (violations.length === 0) {
        console.log(
            `[SUCCESS] No transaction gas limit exceeds the EIP-7825 cap of ${cap} gas`
        )
        return
    }

    console.error(
        `[ERROR] ${violations.length} transaction gas limit(s) exceed the EIP-7825 cap of ${cap} gas:`
    )
    for (const violation of violations) {
        const value = violation.value.toLocaleString('en-US')
        console.error(
            `  ${violation.file}:${violation.line}: ${violation.raw} (${value})`
        )
        console.error(`    ${violation.text}`)
    }
    console.error(
        '\nOsaka rejects any transaction declaring more than 2^24 gas. Use'
    )
    console.error(
        'DEFAULT_TX_GAS_LIMIT from utils/constants.ts instead of a literal.'
    )
    console.error(
        'If the value is a block gas limit and not a transaction gas limit,'
    )
    console.error('add the file to EXCLUDED_FILES in this script.')
    process.exit(1)
}

main()
