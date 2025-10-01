import * as fs from 'fs'
import { FileSystemError } from '../utils/errors'

interface CoverageMetric {
    covered: number
    total: number
}

interface CoverageData {
    [filename: string]: {
        s?: Record<string, number> // Statements
        f?: Record<string, number> // Functions
        b?: Record<string, number[]> // Branches
    }
}

interface Thresholds {
    lines: number
    branches: number
    functions: number
    statements: number
}

type MetricType = keyof Thresholds

/**
 * Reads and validates coverage data from the coverage report
 */
function loadCoverageData(): CoverageData {
    const filePath = './coverage/coverage-final.json'

    try {
        if (!fs.existsSync(filePath)) {
            throw FileSystemError.fileNotFound(filePath)
        }

        const coverageRaw = fs.readFileSync(filePath, 'utf8')

        if (!coverageRaw.trim()) {
            throw new FileSystemError(
                'Coverage file is empty',
                filePath,
                'read'
            )
        }

        return JSON.parse(coverageRaw) as CoverageData
    } catch (error) {
        if (error instanceof FileSystemError) {
            console.error('❌ Coverage file error:', error.message)
            console.error('   File path:', error.filePath)
            console.error('   Operation:', error.operation)
        } else if (error instanceof SyntaxError) {
            console.error('❌ Invalid JSON in coverage file:', filePath)
            console.error('   Error:', error.message)
        } else {
            console.error('❌ Unexpected error reading coverage file:', error)
        }
        process.exit(1)
    }
}

/**
 * Coverage thresholds that must be met
 */
const thresholds: Thresholds = {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100,
}

/**
 * Initialize total coverage metrics
 */
const total: Record<MetricType, CoverageMetric> = {
    lines: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
}

/**
 * Process coverage data and calculate metrics
 */
function processCoverageData(coverage: CoverageData): void {
    for (const file of Object.values(coverage)) {
        const { s = {}, f = {}, b = {} } = file

        // Statements
        const sValues = Object.values(s)
        total.statements.covered += sValues.filter((count) => count > 0).length
        total.statements.total += sValues.length

        // Functions
        const fValues = Object.values(f)
        total.functions.covered += fValues.filter((count) => count > 0).length
        total.functions.total += fValues.length

        // Branches
        const bValues = Object.values(b)
        for (const branchCounts of bValues) {
            if (Array.isArray(branchCounts)) {
                total.branches.covered += branchCounts.filter(
                    (count: number) => count > 0
                ).length
                total.branches.total += branchCounts.length
            }
        }

        // Lines (fallback: count non-zero statements)
        total.lines.covered += sValues.filter((count) => count > 0).length
        total.lines.total += sValues.length
    }
}

/**
 * Check if coverage thresholds are met and display results
 */
function checkThresholds(): boolean {
    let failed = false
    console.log('\n📊 Coverage Summary:')

    const metrics: MetricType[] = [
        'lines',
        'branches',
        'functions',
        'statements',
    ]

    for (const metric of metrics) {
        const { covered, total: totalCount } = total[metric]
        const pct = totalCount > 0 ? (covered / totalCount) * 100 : 0
        const pass = pct >= thresholds[metric]
        const status = pass ? '✅' : '❌'

        console.log(
            `${status} ${metric}: ${pct.toFixed(2)}% (required: ${thresholds[metric]}%)`
        )

        if (!pass) {
            failed = true
        }
    }

    return !failed
}

/**
 * Main execution function
 */
function main(): void {
    try {
        const coverage = loadCoverageData()
        processCoverageData(coverage)
        const allThresholdsMet = checkThresholds()

        if (!allThresholdsMet) {
            console.error('\n❌ Coverage thresholds not met!')
            process.exit(1)
        } else {
            console.log('\n✅ All coverage thresholds met!')
            process.exit(0)
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error)
        process.exit(1)
    }
}

// Execute the main function
main()
