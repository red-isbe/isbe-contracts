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
import { HardhatPluginError } from 'hardhat/plugins'
import {
    BlockscoutGenerateError,
    generateStandardInput,
} from './standardJsonInput'

/**
 * Exports the Solidity Standard JSON Input of ONE contract, taken verbatim
 * from the build-info that compiled it, ready for Blockscout
 * "Solidity (Standard JSON input)" verification.
 *
 *   npx hardhat blockscout:generate \
 *     --contract contracts/evidenceregistry/EvidenceRegistryFacet.sol:EvidenceRegistryFacet
 *
 * Offline: no compilation, no RPC, no KMS, no Blockscout API.
 */
task(
    'blockscout:generate',
    'Exports the Solidity Standard JSON Input of one contract (verbatim build-info input) for Blockscout verification'
)
    .addParam(
        'contract',
        'Contract to verify: Fully Qualified Name (path/Contract.sol:Contract, preferred) or unique contract name'
    )
    .addOptionalParam(
        'buildInfo',
        'Use this build-info instead of the one referenced by the current artifact: file path, <id> or <id>.json under artifacts/build-info'
    )
    .addOptionalParam(
        'output',
        'Output file, outside the artifacts directory (default: verify/<Contract>.<buildInfoId>.standard-input.json)'
    )
    .setAction(async (taskArgs, hre) => {
        const { contract, buildInfo, output } = taskArgs as {
            contract: string
            buildInfo?: string
            output?: string
        }
        try {
            const r = await generateStandardInput({
                contract,
                buildInfo,
                output,
                artifacts: hre.artifacts,
                artifactsDir: hre.config.paths.artifacts,
                root: hre.config.paths.root,
            })

            console.log('=== Blockscout: Solidity Standard JSON Input ===\n')
            console.log(`Contract:        ${r.fullyQualifiedName}`)
            console.log(
                `Build-info:      ${r.buildInfoId} ${r.explicitBuildInfo ? '(--build-info)' : '(from artifact)'}`
            )
            console.log(`Build-info file: ${r.buildInfoPath}`)
            console.log(`Solidity:        v${r.solcLongVersion}`)
            console.log(
                `Optimizer:       ${JSON.stringify(r.settings.optimizer)}`
            )
            console.log(`EVM version:     ${String(r.settings.evmVersion)}`)
            console.log(`viaIR:           ${String(r.settings.viaIR)}`)
            console.log(
                `Metadata:        ${JSON.stringify(r.settings.metadata)}`
            )
            console.log(
                `Libraries:       ${JSON.stringify(r.settings.libraries)}`
            )
            console.log(
                `Remappings:      ${JSON.stringify(r.settings.remappings)}`
            )
            console.log(`Sources:         ${r.sourcesCount}`)
            for (const w of r.warnings) console.log(`\n⚠️  ${w}`)
            console.log(
                `\n✅ Written: ${r.outputPath} (${(r.outputBytes / 1024 / 1024).toFixed(2)} MB)`
            )
            console.log(
                `\nBlockscout → "Solidity (Standard JSON input)": compiler v${r.solcLongVersion}, contract ${r.contractName}, upload the file above.`
            )
            return r
        } catch (err) {
            if (err instanceof BlockscoutGenerateError) {
                throw new HardhatPluginError('blockscout:generate', err.message)
            }
            throw err
        }
    })
