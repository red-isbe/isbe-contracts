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
// Test Helper Utilities for ISBE Deployment Testing

const fs = require('fs')
const path = require('path')

class TestHelpers {
    /**
     * Update Hardhat configuration for localhost network
     */
    static updateHardhatConfig(curve, chainId) {
        const configPath = path.join(__dirname, '..', '..', 'hardhat.config.ts')
        let configContent = fs.readFileSync(configPath, 'utf8')

        // Find localhost configuration and replace it
        const localhostRegex = /localhost: \{[^}]*\}/s

        let localhostConfig
        if (curve === 'secp256r1') {
            localhostConfig = `localhost: {
        url: 'http://127.0.0.1:8545',
        chainId: ${chainId},
        accounts: SECP256R1_ACCOUNT_KEYS,
        gasPrice: 0,
        gas: 10_000_000,
        curve: 'secp256r1',
        secp256r1Accounts: SECP256R1_ACCOUNTS,
    }`
        } else {
            localhostConfig = `localhost: {
        url: 'http://127.0.0.1:8545',
        chainId: ${chainId},
        accounts: ACCOUNTS,
        gasPrice: 0,
        gas: 10_000_000,
        curve: 'secp256k1',
    }`
        }

        configContent = configContent.replace(localhostRegex, localhostConfig)
        fs.writeFileSync(configPath, configContent)

        return {
            curve,
            chainId,
            updated: true,
            path: configPath,
        }
    }

    /**
     * Parse deployment output for key information
     */
    static parseDeploymentOutput(output) {
        const lines = output.split('\n')
        const result = {
            governance: null,
            businessLogics: [],
            useCases: [],
            transactions: [],
            gasUsed: 0,
            errors: [],
        }

        lines.forEach((line) => {
            // Extract governance address
            if (line.includes('Factory address:')) {
                const match = line.match(/0x[a-fA-F0-9]{40}/)
                if (match) result.governance = match[0]
            }

            // Extract transaction hashes
            const txMatch = line.match(/0x[a-fA-F0-9]{64}/)
            if (txMatch) {
                result.transactions.push(txMatch[0])
            }

            // Extract gas usage
            const gasMatch = line.match(/Gas used: ([0-9,]+)/)
            if (gasMatch) {
                result.gasUsed += parseInt(gasMatch[1].replace(/,/g, ''))
            }

            // Extract errors
            if (line.includes('Error:') || line.includes('❌')) {
                result.errors.push(line.trim())
            }
        })

        return result
    }

    /**
     * Validate network connectivity
     */
    static async validateNetworkConnectivity(provider, expectedChainId) {
        try {
            const network = await provider.getNetwork()
            const blockNumber = await provider.getBlockNumber()

            return {
                connected: true,
                chainId: network.chainId,
                blockNumber: blockNumber,
                validChainId: network.chainId === expectedChainId,
            }
        } catch (error) {
            return {
                connected: false,
                error: error.message,
            }
        }
    }

    /**
     * Generate test report HTML
     */
    static generateHtmlReport(testResults, outputPath) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>ISBE Deployment Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .output { background-color: #f5f5f5; padding: 10px; white-space: pre-wrap; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🚀 ISBE Deployment Test Results</h1>
    <p>Generated on: ${new Date().toISOString()}</p>
    
    ${Object.entries(testResults)
        .map(
            ([network, result]) => `
        <div class="section">
            <h2>${network.toUpperCase()} Network</h2>
            <p class="${result.success ? 'success' : 'error'}">
                Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </p>
            ${result.duration ? `<p>Duration: ${result.duration}ms</p>` : ''}
            ${result.curve ? `<p>Curve: ${result.curve}</p>` : ''}
            ${result.chainId ? `<p>Chain ID: ${result.chainId}</p>` : ''}
            ${result.error ? `<p class="error">Error: ${result.error}</p>` : ''}
            ${
                result.output
                    ? `
                <h3>Deployment Output:</h3>
                <div class="output">${result.output}</div>
            `
                    : ''
            }
        </div>
    `
        )
        .join('')}
    
</body>
</html>`

        fs.writeFileSync(outputPath, html)
        return outputPath
    }

    /**
     * Create network startup scripts for Besu
     */
    static createBesuStartupScripts() {
        const scriptsDir = path.join(__dirname, '..', 'network-configs')

        // secp256k1 startup script
        const k1Script = `#!/bin/bash
# Start Besu network with secp256k1 configuration
echo "🚀 Starting Besu network with secp256k1..."
cd ../isbe-besu-local-deployer
docker-compose down
# Update genesis.json for secp256k1
cp config/genesis-secp256k1.json config/genesis.json
docker-compose up -d
echo "✅ secp256k1 network started on http://127.0.0.1:8545"
`

        // secp256r1 startup script
        const r1Script = `#!/bin/bash
# Start Besu network with secp256r1 configuration
echo "🔐 Starting Besu network with secp256r1..."
cd ../isbe-besu-local-deployer
docker-compose down
# Update genesis.json for secp256r1
cp config/genesis-secp256r1.json config/genesis.json
docker-compose up -d
echo "✅ secp256r1 network started on http://127.0.0.1:8545"
`

        fs.writeFileSync(path.join(scriptsDir, 'start-secp256k1.sh'), k1Script)
        fs.writeFileSync(path.join(scriptsDir, 'start-secp256r1.sh'), r1Script)

        // Make scripts executable
        require('child_process').exec(`chmod +x ${scriptsDir}/*.sh`)

        return {
            k1Script: path.join(scriptsDir, 'start-secp256k1.sh'),
            r1Script: path.join(scriptsDir, 'start-secp256r1.sh'),
        }
    }

    /**
     * Extract deployment metrics from output
     */
    static extractMetrics(output) {
        const metrics = {
            deploymentTime: 0,
            gasUsed: 0,
            contractsDeployed: 0,
            transactions: 0,
            errors: 0,
        }

        const lines = output.split('\n')

        lines.forEach((line) => {
            // Count deployed contracts
            if (line.includes('deployed') || line.includes('Deployed')) {
                metrics.contractsDeployed++
            }

            // Count transactions (tx hashes)
            if (line.match(/0x[a-fA-F0-9]{64}/)) {
                metrics.transactions++
            }

            // Count errors
            if (
                line.includes('Error:') ||
                line.includes('❌') ||
                line.includes('failed')
            ) {
                metrics.errors++
            }

            // Extract gas usage
            const gasMatch = line.match(/Gas used: ([0-9,]+)/)
            if (gasMatch) {
                metrics.gasUsed += parseInt(gasMatch[1].replace(/,/g, ''))
            }
        })

        return metrics
    }
}

module.exports = TestHelpers
