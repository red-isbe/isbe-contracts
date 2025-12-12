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
