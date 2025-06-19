const fs = require('fs')

const output = fs.readFileSync('slither-output.txt', 'utf8')

// Severity levels you want to check
const severities = ['high', 'medium']

// Flag to track if we should fail the process
let hasIssues = false

for (const level of severities) {
    // Create a regex to match lines like "High 1", "medium 2", etc.
    const regex = new RegExp(`${level}\\s+\\d+`, 'i')
    const match = output.match(regex)

    if (match && /\d+/.test(match[0])) {
        const count = parseInt(match[0].match(/\d+/)[0], 10)
        if (count > 0) {
            console.error(
                `❌ Slither found ${count} ${level.toUpperCase()} severity issues!`
            )
            hasIssues = true
        } else {
            console.log(`✅ No ${level.toUpperCase()} severity issues found.`)
        }
    } else {
        console.log(`✅ No ${level.toUpperCase()} severity issues found.`)
    }
}

if (hasIssues) {
    process.exit(1)
}
