const fs = require('fs')

const coverage = JSON.parse(
    fs.readFileSync('./coverage/coverage-final.json', 'utf8')
)

const thresholds = {
    lines: 84,
    branches: 84,
    functions: 84,
    statements: 84,
}

let total = {
    lines: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
}

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
        total.branches.covered += branchCounts.filter(
            (count) => count > 0
        ).length
        total.branches.total += branchCounts.length
    }

    // Lines (fallback: count non-zero statements)
    total.lines.covered += sValues.filter((count) => count > 0).length
    total.lines.total += sValues.length
}

let failed = false
console.log('\n📊 Coverage Summary:')

for (const metric of ['lines', 'branches', 'functions', 'statements']) {
    const { covered, total: totalCount } = total[metric]
    const pct = (covered / totalCount) * 100 || 0
    const pass = pct >= thresholds[metric]
    const status = pass ? '✅' : '❌'

    console.log(
        `${status} ${metric}: ${pct.toFixed(2)}% (required: ${thresholds[metric]}%)`
    )

    if (!pass) failed = true
}

if (failed) {
    console.error('\n❌ Coverage thresholds not met!')
    process.exit(1)
} else {
    console.log('\n✅ All coverage thresholds met!')
}
