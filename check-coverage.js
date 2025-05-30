const fs = require('fs')

const coverage = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'))

// Set your thresholds
const thresholds = {
    lines: 95,
    branches: 95,
    functions: 95,
    statements: 95,
}

let total = {
    lines: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
}

for (const fileCoverage of Object.values(coverage)) {
    const { s, b, f } = fileCoverage

    // Statements
    total.statements.covered += Object.values(s).filter(
        (count) => count > 0
    ).length
    total.statements.total += Object.values(s).length

    // Branches
    for (const counts of Object.values(b)) {
        total.branches.total += counts.length
        total.branches.covered += counts.filter((count) => count > 0).length
    }

    // Functions
    total.functions.covered += Object.values(f).filter(
        (count) => count > 0
    ).length
    total.functions.total += Object.values(f).length

    // Lines (fallback to statement count as proxy)
    total.lines.covered += Object.values(s).filter((count) => count > 0).length
    total.lines.total += Object.values(s).length
}

// Compute and print the results
let failed = false
console.log('\n📊 Coverage Summary:')

for (const metric of ['lines', 'branches', 'functions', 'statements']) {
    const data = total[metric]
    const pct = (data.covered / data.total) * 100 || 0
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
