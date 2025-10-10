import { task } from 'hardhat/config'
import {
    buildGenesisWithAlloc,
    type GenesisAlloc,
    matchContractNames,
    retrieveSlotStructure,
    validateGenesis,
    ContractRegistry,
} from '../scripts/genesisGenerator'
import { HttpNetworkConfig } from 'hardhat/types'

const REGISTRY_FILENAME = "isbe-contract-registry.json";

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
        const contractRegistry = new ContractRegistry();
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
            hre.config as unknown as { genesisGenerator: { outputDir: string } }
        ).genesisGenerator.outputDir
        if (outputDir.slice(-1) !== '/') {
            outputDir += '/'
        }

        const templateFile = taskArgs.template
        const genesisTemplateFile = templateDir + templateFile
        const outputFile = outputDir + templateFile

        const registryFile = (outputDir.endsWith('/') ? outputDir : outputDir + '/') + REGISTRY_FILENAME;
        console.log(`📄 Using template file: ${genesisTemplateFile}`)

        console.log('🚀 DeployAll...')
        const result = await hre.run('deployAll')
        console.log('✅ Deploy all (Done).')

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

        contractRegistry.dumpRegistry(slotStructure, registryFile);

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

        return result // propagate deployAll result if neeeded
    })

task(
    'genesis:validate',
    'Validate genesis by extracting storage slots from deployment transactions in Hardhat network'
)
    .addOptionalParam(
        'gobernanceaddress',
        'Gobernance Address',
        '0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6'
    )
    .setAction(async (taskArgs, hre) => {
        console.info(
            '---------------------------------------------------------------------'
        )
        console.info('🚀    ISBE Genesis validation started...')
        console.info(
            '---------------------------------------------------------------------'
        )

        const gobernanceaddress = taskArgs.gobernanceaddress
        console.log(`📄 Using Gobernance Proxy Address: ${gobernanceaddress}`)
        if (
            !gobernanceaddress ||
            !/^0x[a-fA-F0-9]{40}$/.test(gobernanceaddress)
        ) {
            console.error('Invalid Gobernance Proxy Address')
            return
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
        const registryFile = (outputDir.endsWith('/') ? outputDir : outputDir + '/') + REGISTRY_FILENAME;
        const contractRegistry = new ContractRegistry();
        contractRegistry.retrieveContractRegistry(registryFile);
        console.log(
            '✅ Contract registry retrieved----------------------------------------------------------'
        )
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

        console.log(
            '✅ Genesis validation (Done).----------------------------------------------------------'
        )

        return registryFile;
    })
