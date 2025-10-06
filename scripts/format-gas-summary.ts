#!/usr/bin/env npx ts-node

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
const NETWORK_BLOCK_GAS_LIMIT = 20_000_000

// Formats the gas usage summary Markdown file for better readability.
function formatGasSummary(): void {
    const filePath = join(process.cwd(), 'docs/generated/gas-usage-summary.md')
    try {
        const original = readFileSync(filePath, 'utf8')
        const improved = improveFormatting(original)
        writeFileSync(filePath, improved, 'utf8')
        console.log('✅ Gas usage summary formatted successfully!')
    } catch (error) {
        console.error('❌ Error formatting gas summary:', error)
        process.exit(1)
    }
}

// Simple, resilient reformatter for the Hardhat gas reporter output (markdown mode)
function improveFormatting(content: string): string {
    const ts = new Date().toISOString().split('T')[0]
    const lines = content.split('\n')

    let out = `# ⛽ Gas Usage Report\n\n`
    out += `> Generated on ${ts}\n\n`

    // Extract configuration from the header line
    const cfg = lines.find((l) => l.includes('Solc version')) || ''
    if (cfg) {
        const solc = cfg.match(/Solc version: ([\d.]+)/)?.[1] || ''
        const opt = cfg.match(/Optimizer enabled: (\w+)/)?.[1] || ''
        const runs = cfg.match(/Runs: (\d+)/)?.[1] || ''
        const limit = cfg.match(/Block limit: (\d+)/)?.[1] || ''

        out += `## Configuration\n\n`
        out += `| Setting | Value |\n|---|---|\n`
        if (solc) out += `| Solidity Version | ${solc} |\n`
        if (opt)
            out += `| Optimizer | ${opt === 'true' ? 'Enabled' : 'Disabled'} |\n`
        if (runs)
            out += `| Optimizer Runs | ${Number(runs).toLocaleString()} |\n`
        if (limit)
            out += `| Block Gas Limit | ${Number(limit).toLocaleString()} |\n`
        out += `\n`
    }

    // Accumulate rows before outputting
    const methodRows: MethodRow[] = []
    const deployRows: DeployRow[] = []

    let inMethods = false
    let inDeploys = false

    for (const raw of lines) {
        const line = raw.trimEnd()
        if (
            line.includes('Solc version') ||
            line.includes('·|·') ||
            line.includes('|  Contract ')
        )
            continue

        if (line.includes('Methods')) {
            inMethods = true
            inDeploys = false
            continue
        }

        if (line.includes('Deployments')) {
            inMethods = false
            inDeploys = true
            continue
        }

        // Data rows: look for the middle-dot separators used by a gas-reporter
        if (line.includes('·') && !line.includes('·---')) {
            const clean = line.replace(/[│|]/g, '').trim()
            if (inMethods) {
                const row = formatMethodRow(clean)
                if (row) methodRows.push(row)
                continue
            }
            if (inDeploys) {
                const row = formatDeployRow(clean)
                if (row) deployRows.push(row)
            }
        }
    }

    // Sort: highest avg gas first
    methodRows.sort((a, b) => b.avg - a.avg)
    deployRows.sort((a, b) => b.cost - a.cost)

    // Output Method Gas Usage
    out += `## Method Gas Usage\n\n`
    out += `| Contract | Method | Min | Max | Avg | Block usage (%)(20M) | Calls |\n`
    out += `|---|---|---|---|---|---|---|\n`

    const maxContractLen = Math.max(
        ...methodRows.map((r) => r.contract.length),
        8
    )
    const maxMethodLen = Math.max(...methodRows.map((r) => r.method.length), 6)

    for (const row of methodRows) {
        const contractPad = row.contract.padEnd(maxContractLen)
        const methodPad = `\`${row.method}\``.padEnd(maxMethodLen + 2) // +2 for backticks
        out += `| ${contractPad} | ${methodPad} | ${fmtNum(row.min)} | ${fmtNum(
            row.max
        )} | ${fmtNum(row.avg)} | ${row.bar} | ${fmtNum(row.calls)} |\n`
    }

    // Output Deployment Costs
    out += `\n## Deployment Costs\n\n`
    out += `| Contract | Deployment Cost | % of Block Limit (20M) |\n`
    out += `|---|---|---|\n`

    const maxDeployContractLen = Math.max(
        ...deployRows.map((r) => r.contract.length),
        8
    )

    for (const row of deployRows) {
        const contractPad = row.contract.padEnd(maxDeployContractLen)
        const costStr = fmtNum(row.cost)
        const progressBar = renderProgressBar(row.percent)
        out += `| ${contractPad} | ${costStr} | ${progressBar} |\n`
    }

    out += `\n---\n\n`
    out += `Tips: use packed structs, batch operations, optimize loops, prefer uint256 for math, and consider proxy patterns for large contracts.\n`
    return out
}

interface MethodRow {
    contract: string
    method: string
    min: number
    max: number
    avg: number
    bar: string
    calls: number
}

// ... existing code ...

interface MethodRow {
    contract: string
    method: string
    min: number
    max: number
    avg: number
    bar: string
    calls: number
}

function formatContractName(name: string): string {
    return replaceAll(replaceAll(name, 'TestWrapper', '(TW)'), 'Facet', '(F)')
}

function abbreviateMethodName(method: string): string {
    let result = method
    result = replaceAll(result, 'bytes', 'b')
    result = replaceAll(result, 'address', 'adr')
    result = replaceAll(result, 'string', 'str')
    return replaceAll(result, 'uint', 'u')
}

function calculateGasPercentage(gasUsed: number): string {
    return ((gasUsed * 100) / NETWORK_BLOCK_GAS_LIMIT).toString().concat('%')
}

function replaceAll(
    init: string,
    searchValue: string,
    replaceValue: string
): string {
    return init.split(searchValue).join(replaceValue)
}

function formatMethodRow(line: string): MethodRow | null {
    const MINIMUM_PARTS_COUNT = 6
    const CONTRACT_INDEX = 0
    const METHOD_INDEX = 1
    const MIN_INDEX = 2
    const MAX_INDEX = 3
    const AVG_INDEX = 4
    const CALLS_INDEX = 5

    const parts = line
        .split('·')
        .map((p) => p.trim())
        .filter(Boolean)

    if (parts.length < MINIMUM_PARTS_COUNT) return null

    const contract = formatContractName(parts[CONTRACT_INDEX])
    const method = abbreviateMethodName(parts[METHOD_INDEX])
    const min = parseInt(parts[MIN_INDEX]) || 0
    const max = parseInt(parts[MAX_INDEX]) || 0
    const avg = parseInt(parts[AVG_INDEX]) || 0
    const bar: string = renderProgressBar(calculateGasPercentage(avg))
    const calls = parseInt(parts[CALLS_INDEX]) || 0

    return { contract, method, min, max, avg, bar, calls }
}

interface DeployRow {
    contract: string
    cost: number
    percent: string
}

function formatDeployRow(line: string): DeployRow | null {
    const parts = line
        .split('·')
        .map((p) => p.trim())
        .filter(Boolean)

    if (parts.length < 3) return null

    const contract = formatContractName(parts[0])

    let cost = 0
    let percent = '0%'

    for (const p of parts) {
        if (/^\d+$/.test(p)) cost = parseInt(p)
        if (p.includes('%')) percent = calculateGasPercentage(cost)
    }

    if (!contract || cost === 0) return null

    return { contract, cost, percent }
}

// ... existing code ...

interface DeployRow {
    contract: string
    cost: number
    percent: string
}
//
// function formatDeployRow(line: string): DeployRow | null {
//     const parts = line
//         .split('·')
//         .map((p) => p.trim())
//         .filter(Boolean)
//
//     if (parts.length < 3) return null
//
//     const contract = parts[0]
//         .replace('TestWrapper', '(TW)')
//         .replace('Facet', '(F)')
//
//     let cost = 0
//     let percent = '0%'
//
//     for (const p of parts) {
//         if (/^\d+$/.test(p)) cost = parseInt(p)
//         if (p.includes('%'))
//             percent = ((cost * 100) / NETWORK_BLOCK_GAS_LIMIT)
//                 .toString()
//                 .concat('%')
//     }
//
//     if (!contract || cost === 0) return null
//
//     return { contract, cost, percent }
// }

// Format number with commas, left-aligned
function fmtNum(n: number): string {
    return n.toLocaleString('en-US').padStart(1) // No extra padding; left-aligned naturally
}

function renderProgressBar(percentStr: string): string {
    const percentage = parseFloat(percentStr) || 0
    const length = 40
    const filled = Math.floor((length * percentage) / 100)

    // Format percentage with 2 decimals, no % symbol
    const percentText = percentage.toFixed(2)
    const textLength = percentText.length

    // Calculate position to centre the text
    const textStart = Math.floor((length - textLength) / 2)
    const textEnd = textStart + textLength

    let bar = ''
    for (let i = 0; i < length; i++) {
        // Insert percentage text in the middle
        if (i >= textStart && i < textEnd) {
            bar += percentText[i - textStart]
        } else {
            bar += i < filled ? '█' : '░'
        }
    }

    return bar
}

if (require.main === module) {
    formatGasSummary()
}

export { formatGasSummary }
