import { task } from 'hardhat/config'
import {
    buildGenesisWithAlloc,
    type GenesisAlloc,
    matchContractNames,
    retrieveSlotStructure,
    validateGenesis,
    ContractRegistry,
    extractISBEAdminAddress,
    extractCurve,
} from '../scripts/genesisGenerator'
import { HttpNetworkConfig } from 'hardhat/types'
import {
    DeployedBusinessLogic,
    GovernanceConfig,
} from './deployment/types/DeploymentTypes'
import { SignatureProviderFactory } from './deployment/providers/SignatureProviderFactory'
import { CleanGovernanceDeployer } from './deployment/deployers/CleanGovernanceDeployer'
import { CleanBusinessLogicDeployer } from './deployment/deployers/CleanBusinessLogicDeployer'
import { DeploymentConfig } from './deployment/config/DeploymentConfig'
import { Signer } from 'ethers'
import { CleanUseCaseDeployer } from './deployment/deployers/CleanUseCaseDeployer'

const REGISTRY_FILENAME = 'isbe-contract-registry.json'

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
    .addOptionalParam(
        'template',
        'Template JSON file to use',
        'qbftConfigFile.json'
    )
    .setAction(async (taskArgs, hre) => {
        try {
            const contractRegistry = new ContractRegistry()
            console.info(
                '---------------------------------------------------------------------'
            )
            console.info('🚀    ISBE Genesis generation started...')
            console.info(
                '---------------------------------------------------------------------'
            )
            hre.network.name = 'hardhat'

            let templateDir = (
                hre.config as unknown as {
                    genesisGenerator: { templateDir: string }
                }
            ).genesisGenerator.templateDir
            if (templateDir.slice(-1) !== '/') {
                templateDir += '/'
            }
            let outputDir = (
                hre.config as unknown as {
                    genesisGenerator: { outputDir: string }
                }
            ).genesisGenerator.outputDir
            if (outputDir.slice(-1) !== '/') {
                outputDir += '/'
            }

            const templateFile = taskArgs.template
            const genesisTemplateFile = templateDir + templateFile
            const outputFile = outputDir + templateFile

            const registryFile =
                (outputDir.endsWith('/') ? outputDir : outputDir + '/') +
                REGISTRY_FILENAME
            console.log(`📄 Using template file: ${genesisTemplateFile}`)

            const isbeAdmin = await extractISBEAdminAddress(genesisTemplateFile)
            console.log(
                `📄 ISBE Admin address extracted from first genesis entry: ${isbeAdmin}`
            )

            const governanceConfig: GovernanceConfig = {
                accountAddress: isbeAdmin,
                initData: '0x',
            }
            const signatureProvider = SignatureProviderFactory.create(hre)
            const cleanGovernanceDeployer = new CleanGovernanceDeployer(
                hre,
                signatureProvider
            )

            console.log('🚀 Deploying governance factory...')
            const governanceResult = await cleanGovernanceDeployer.deploy(
                governanceConfig,
                signatureProvider
            )
            console.log(
                `✅ Governance factory deployed at: ${governanceResult.address}`
            )

            console.log('🚀 Genesis generation...')
            let slotStructure: GenesisAlloc = await retrieveSlotStructure(hre)
            slotStructure = await matchContractNames(hre, slotStructure)
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

            contractRegistry.dumpRegistry(slotStructure, registryFile)

            console.log(
                '✅ Contract registry generated----------------------------------------------------------'
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
    .addOptionalParam('gobernanceaddress', 'Gobernance Address')
    .addOptionalParam(
        'template',
        'Template JSON file to use',
        'qbftConfigFile.json'
    )
    .setAction(async (taskArgs, hre) => {
        console.info(
            '---------------------------------------------------------------------'
        )
        console.info('🚀    ISBE Genesis validation started...')
        console.info(
            '---------------------------------------------------------------------'
        )

        const templateDir = (
            hre.config as unknown as {
                genesisGenerator: { templateDir: string }
            }
        ).genesisGenerator.templateDir

        const templateFile = taskArgs.template
        const genesisTemplateFile = templateDir + templateFile
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

        let outputDir = (
            hre.config as unknown as { genesisGenerator: { outputDir: string } }
        ).genesisGenerator.outputDir
        if (outputDir.slice(-1) !== '/') {
            outputDir += '/'
        }

        let gobernanceaddress = taskArgs.gobernanceaddress
        if (!gobernanceaddress) {
            const registryFile =
                (outputDir.endsWith('/') ? outputDir : outputDir + '/') +
                REGISTRY_FILENAME
            const contractRegistry = new ContractRegistry()
            contractRegistry.retrieveContractRegistry(registryFile)
            gobernanceaddress = contractRegistry.getAddress(
                'EIP2535AccessControl'
            )
            console.log(
                '✅ EIP2535AccessControl retrieved from registry: ' +
                    gobernanceaddress
            )
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(gobernanceaddress)) {
            console.error('Invalid Gobernance Proxy Address')
            return
        }
        console.log(`📄 Using Gobernance Proxy Address: ${gobernanceaddress}`)

        while (!(await jsonRpcCall(url))) {
            process.stdout.write(
                `Waiting for network ${hre.network.name} to be available... \r`
            )
            await sleep(5000)
        }
        console.log(
            `Waiting for network ${hre.network.name} to be available [OK]           `
        )

        await validateGenesis(hre, gobernanceaddress)

        console.log(' deploy usecase facets......')

        const signatureProvider = SignatureProviderFactory.create(hre)

        const isbeAdmin: Signer = await signatureProvider.getSigner()
        const isbeAdminAddress = await isbeAdmin.getAddress()
        console.log(`ISBE Admin Address: ${isbeAdminAddress}`)

        const businessLogicDeployer = new CleanBusinessLogicDeployer(
            hre,
            signatureProvider
        )

        const config = DeploymentConfig.getDefaultConfig()

        const governanceResult: DeployedBusinessLogic[] =
            await businessLogicDeployer.deployAll(
                config.businessLogics,
                gobernanceaddress
            )

        console.log(' deploy usecase ......')

        const useCaseDeployer = new CleanUseCaseDeployer(hre, signatureProvider)

        const useCases = await useCaseDeployer.deployAll(
            config.useCases,
            gobernanceaddress,
            governanceResult
        )

        console.log(
            `✅ Use cases deployed successfully.   Total: ${useCases.length}----------------------------------------------------------`
        )

        console.log(
            '✅ All alidations (Done).----------------------------------------------------------'
        )
    })
