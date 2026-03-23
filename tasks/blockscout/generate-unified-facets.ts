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
import { task } from 'hardhat/config'

/**
 * Generates a unified JSON file for Blockscout verification.
 *
 *   npx hardhat blockscout:generate
 *
 * Output:
 *   artifacts/verify/ALL-FACETS-unified.json
 */
task(
    'blockscout:generate',
    'Generates unified verification JSON for all Facet/EIP2535AccessControl/IsbeProxy contracts'
).setAction(async () => {
    const fs = await import('fs')
    const { execSync } = await import('child_process')

    console.log(
        '=== GENERANDO JSON UNIFICADO - TODOS LOS CONTRATOS PRINCIPALES ===\n'
    )
    console.log('Usando rutas relativas correctas desde contracts/\n')

    // Read build info - get the latest file
    const buildInfoDir = 'artifacts/build-info'
    const buildFiles = fs.readdirSync(buildInfoDir)
    const latestBuildFile = buildFiles
        .filter((f: string) => f.endsWith('.json'))
        .sort()
        .pop()

    if (!latestBuildFile) {
        throw new Error('No build-info found. Run `npx hardhat compile` first.')
    }

    console.log(`Using build info: ${latestBuildFile}`)

    const buildInfo = JSON.parse(
        fs.readFileSync(`${buildInfoDir}/${latestBuildFile}`, 'utf-8')
    )

    // Create unified verification JSON
    const unifiedVerification = {
        language: 'Solidity',
        compiler: { version: 'v0.8.28+commit.7893614a' },
        settings: {
            evmVersion: buildInfo.input.settings.evmVersion,
            optimizer: buildInfo.input.settings.optimizer,
            compilationTarget: {},
        },
        sources: buildInfo.input.sources,
    }

    // Get all production contract SOURCE files (exclude testwrappers, mocks, interfaces)
    const cmd =
        'find contracts -name "*.sol" | grep -E "Facet|EIP2535AccessControl|IsbeProxy" | grep -v testwrapper | grep -v TestWrapper | grep -v Mock'
    const output = execSync(cmd, { encoding: 'utf-8' })

    const lines = output
        .trim()
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
    console.log(`Found ${lines.length} production contract source files`)

    // Add all contracts as compilation targets using CORRECT relative paths
    lines.forEach((facetPath: string) => {
        const contractName =
            facetPath.split('/').pop()?.replace('.sol', '') || ''
        unifiedVerification.settings.compilationTarget[facetPath] = contractName
    })

    console.log(
        'Total sources:',
        Object.keys(unifiedVerification.sources).length
    )
    console.log(
        'Contracts to verify:',
        Object.keys(unifiedVerification.settings.compilationTarget).length
    )

    // Save unified file
    const unifiedPath = 'artifacts/verify/ALL-FACETS-unified.json'
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedVerification, null, 2))

    console.log('\n✅ Created:', unifiedPath)
    console.log(
        'Size:',
        (fs.statSync(unifiedPath).size / 1024 / 1024).toFixed(2),
        'MB'
    )
    console.log('\n📋 File ready to use for Blockscout verification!')
})
