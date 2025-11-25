import { task } from 'hardhat/config'
import {
    buildGenesisWithAlloc,
    type GenesisAlloc,
    matchContractNames,
    retrieveSlotStructure,
    validateGenesis,
    extractISBEAdminAddress,
    extractCurve,
    BootstrapIsbenetwork,
} from '../scripts/genesisGenerator'
import { HttpNetworkConfig } from 'hardhat/types'
import { GovernanceConfig } from './deployment/types/DeploymentTypes'
import { SignatureProviderFactory } from './deployment/providers/SignatureProviderFactory'
import { CleanGovernanceDeployer } from './deployment/deployers/CleanGovernanceDeployer'
//import { CleanUseCaseDeployer } from './deployment/deployers/CleanUseCaseDeployer'

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function jsonRpcCall(urlStr: string): Promise<boolean> {
    const payload = JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'eth_blockNumber',
        params: [],
    })

    try {
        const response = await fetch(urlStr, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: payload,
        })

        await response.json() //ignore output, just check if we get a response
        if (response.ok) {
            return true
        } else {
            return false
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(msg)
        return false
    }
}

task(
    'genesis:generate',
    'Generate genesis by extracting storage slots from deployment transactions in Hardhat network'
)
    .addParam('templatefile', 'Template JSON file to use')
    .addParam('outputfile', 'Generated Output JSON file')
    .addParam('governanceaddress')
    .setAction(async (taskArgs, hre) => {
        try {
            console.info(
                '---------------------------------------------------------------------'
            )
            console.info('🚀    ISBE Genesis generation started...')
            console.info(
                '---------------------------------------------------------------------'
            )
            hre.network.name = 'hardhat'

            const governanceaddress = taskArgs.governanceaddress
            if (
                !governanceaddress ||
                !/^0x[a-fA-F0-9]{40}$/.test(governanceaddress)
            ) {
                throw new Error(
                    'Invalid Gobernance Address' + governanceaddress
                )
            }

            const genesisTemplateFile = taskArgs.templatefile

            const outputFile = taskArgs.outputfile

            console.log(`📄 Using template file: ${genesisTemplateFile}`)
            console.log(`📄 Using output file: ${outputFile}`)

            const isbeAdmin = await extractISBEAdminAddress(genesisTemplateFile)
            console.log(`📄 Extracted ISBE Admin address(es): ${isbeAdmin}`)
            if (isbeAdmin[1] == '') {
                console.log(
                    `📄 ISBE Admin address extracted from first genesis entry: ${isbeAdmin}`
                )

                const governanceConfig: GovernanceConfig = {
                    accountAddress: isbeAdmin[0],
                    initData: '0x',
                }
                const signatureProvider = SignatureProviderFactory.create(hre)
                const cleanGovernanceDeployer = new CleanGovernanceDeployer(
                    hre,
                    signatureProvider
                )

                console.log('🚀 Deploying governance factory...')
                const governanceResult =
                    await cleanGovernanceDeployer.deploy(governanceConfig)
                console.log(
                    `✅ Governance factory deployed at: ${governanceResult.address}`
                )
            } else {
                console.log(
                    `📄 ISBE Admin addresses extracted from genesis entries: ${isbeAdmin[0]} , ${isbeAdmin[1]}`
                )
                const governanceConfig: GovernanceConfig = {
                    accountAddress: isbeAdmin[0],
                    initData: '0x',
                }
                const signatureProvider = SignatureProviderFactory.create(hre)
                const cleanGovernanceDeployer = new CleanGovernanceDeployer(
                    hre,
                    signatureProvider,
                    isbeAdmin[1]
                )

                console.log('🚀 Deploying governance factory...')
                const governanceResult =
                    await cleanGovernanceDeployer.deploy(governanceConfig)
                console.log(
                    `✅ Governance factory deployed at: ${governanceResult.address}`
                )
            }

            console.log('🚀 Genesis generation...')
            let slotStructure: GenesisAlloc = await retrieveSlotStructure(hre)
            slotStructure = await matchContractNames(
                hre,
                slotStructure,
                governanceaddress
            )
            console.log(
                '✅ Slot structure retrieved.----------------------------------------------------------'
            )
            await buildGenesisWithAlloc(
                genesisTemplateFile,
                slotStructure,
                outputFile
            )
            console.log(
                '✅ Genesis file generated successfully.-----------------------------------------------'
            )

            const tableData = Array.from(slotStructure.entries()).map(
                ([address, entry]) => ({
                    Address: address,
                    Contract: entry.contractName ?? '<unknown>',
                    StorageSize: Object.keys(entry.storage ?? {}).length,
                })
            )

            console.log('📘 GENESIS REPORT\n')
            console.table(tableData)

            console.log(
                '✅ Genesis generation (Done).----------------------------------------------------------'
            )
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            console.error('❌ - Error during genesis generation:', msg)
            console.error(error)
            process.exit(1)
        }
    })

task(
    'genesis:validate',
    'Validate genesis by extracting storage slots from deployment transactions in Hardhat network'
)
    .addParam('templatefile', 'Template JSON file to use')
    .addParam('governanceaddress', 'Governance Contract Address')
    .setAction(async (taskArgs, hre) => {
        console.info(
            '---------------------------------------------------------------------'
        )
        console.info('🚀    ISBE Genesis validation started...')
        console.info(
            '---------------------------------------------------------------------'
        )

        const genesisTemplateFile = taskArgs.templatefile
        const curve: string = await extractCurve(genesisTemplateFile)
        console.log(`📄 Using curve: ${curve}`)

        if (curve === 'secp256k1') {
            hre.network.name = 'genesis_validation_network_k1'
        } else if (curve === 'secp256r1') {
            hre.network.name = 'genesis_validation_network_r1'
        } else {
            throw new Error(`Unsupported curve type in genesis file: ${curve}`)
        }

        console.log(`Current network: ${hre.network.name}`)
        const networkConfig: HttpNetworkConfig = hre.config.networks[
            hre.network.name
        ] as HttpNetworkConfig
        if (!networkConfig) {
            console.error(
                `Network ${hre.network.name} not found in hardhat config`
            )
            return
        }
        const url: string = networkConfig.url
        if (!url) {
            console.error(
                `Network ${hre.network.name} is missing url, chainId or accounts in hardhat config`
            )
            return
        }
        console.log(`Using network url: ${url}`)

        const governanceaddress = taskArgs.governanceaddress
        if (!/^0x[a-fA-F0-9]{40}$/.test(governanceaddress)) {
            console.error(
                'Invalid Gobernance Proxy Address: ' + governanceaddress
            )
            return
        }
        console.log(`📄 Using Gobernance Proxy Address: ${governanceaddress}`)

        while (!(await jsonRpcCall(url))) {
            process.stdout.write(
                `Waiting for network ${hre.network.name} to be available... \r`
            )
            await sleep(5000)
        }
        console.log(
            `Waiting for network ${hre.network.name} to be available [OK]           `
        )

        await validateGenesis(hre, governanceaddress)

        console.log(' deploy usecase facets......')

        const bootstrap: BootstrapIsbenetwork = new BootstrapIsbenetwork(
            hre,
            governanceaddress
        )

        console.log('🚀 Bootstrapping usecases facets only...')
        await bootstrap.facetBootstrap()
        console.log('✅ Usecase facets deployed successfully.')

        console.log(
            '✅ All alidations (Done).----------------------------------------------------------'
        )
    })
